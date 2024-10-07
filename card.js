const axios = require('axios');
const sharp = require('sharp');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');

registerFont('./fonts/Unbounded-VariableFont_wght.ttf', { family: 'Unbounded' });

async function createCard(data, callback) {
  const canvas = createCanvas(800, 1000);
  const ctx = canvas.getContext('2d');
  const background = await loadImage('./template/tempalate_final.png');
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  if (data.photo) {
    try {
      const response = await axios.get(data.photo, { responseType: 'arraybuffer' });
      const pngBuffer = await sharp(Buffer.from(response.data)).png().toBuffer();
      const userPhoto = await loadImage(pngBuffer);
      ctx.drawImage(userPhoto, 390, 150, 265, 265); // SPACE FOR AVATAR
    } catch (e) {
      console.error('Error loading image:', e);
    }
  }

  // Настройка шрифта для имени
  let fontSize = 64;
  const maxWidth = canvas.width - 300; // Максимальная доступная ширина с отступами 50px с каждой стороны
  const name = data.name || 'LEPOOKIE';

  // Уменьшаем размер шрифта, пока текст не станет помещаться в отведенную ширину
  do {
    ctx.font = `bold ${fontSize}px "Unbounded"`;
    var textWidth = ctx.measureText(name).width;
    fontSize -= 2; // Уменьшаем шрифт постепенно
  } while (textWidth > maxWidth && fontSize > 10); // Ограничиваем минимальный размер шрифта

  // Вычисляем координаты по центру
  const xCenter = canvas.width / 2 - textWidth / 2;
  const yPosition = 610;

  // Рисуем текст с обводкой и заливкой, применяя letter spacing -5%
  const letterSpacing = -0.05;
  let currentX = xCenter;
  for (const char of name) {
    const charWidth = ctx.measureText(char).width;

    ctx.strokeText(char, currentX, yPosition); // Обводка
    ctx.fillText(char, currentX, yPosition);   // Заливка

    currentX += charWidth + letterSpacing * charWidth; // Применяем отрицательное межбуквенное расстояние
  }

  // Рассчитываем общий рейтинг
  const stats = [data.phy, data.int, data.dri, data.pas, data.thr, data.def, data.ft, data.ppg];
  const sum = stats.reduce((acc, stat) => acc + parseInt(stat), 0);
  let overallRating = Math.floor(sum / stats.length);

  if (overallRating > 99) {
    overallRating = 99;
  }

  // Отображаем Overall Rating
  ctx.font = 'bold 44px "Unbounded"';
  ctx.fillStyle = '#FFFFFF'; // Белый цвет для Overall Rating
  ctx.fillText(`${overallRating}`, 190, 220); // Расположение над POS

  // Настройка текста для остальных полей (цвет, шрифт и т.д.)
  ctx.font = '34px "Unbounded"';
  ctx.fillStyle = '#FFFFFF'; // Белый цвет для остальных значений

  // Определение фиксированной ширины для выравнивания
  const fieldWidth = 60; // Ширина поля для значений
  const paddingRight = 10; // Отступ справа

  // Функция для выравнивания текста по правому краю
  const rightAlign = (value, x, y) => {
    const textWidth = ctx.measureText(value).width;
    ctx.fillText(value, x - textWidth - paddingRight, y); // Вычисление позиции x для выравнивания
  };

  // Bottom-left stats
  ctx.fillText(`${data.phy}`, 180, 670);
  ctx.fillText(`${data.int}`, 180, 720);
  ctx.fillText(`${data.dri}`, 180, 770);
  ctx.fillText(`${data.pas}`, 180, 840);

  // Bottom-right stats
  ctx.fillText(`${data.thr}`, 435, 670);
  ctx.fillText(`${data.def}`, 435, 720);
  ctx.fillText(`${data.ft}`, 435, 770);
  ctx.fillText(`${data.ppg}`, 435, 840);
  
  // Выравнивание значений
  rightAlign(`${data.phy}`, 240, 670);
  rightAlign(`${data.int}`, 240, 720);
  rightAlign(`${data.dri}`, 240, 770);
  rightAlign(`${data.pas}`, 240, 840);
  rightAlign(`${data.thr}`, 580, 670);
  rightAlign(`${data.def}`, 580, 720);
  rightAlign(`${data.ft}`, 580, 770);
  rightAlign(`${data.ppg}`, 580, 840);

  // ## Сохранение изображения
  const buffer = canvas.toBuffer('image/png');
  const imagePath = `./result/${Date.now()}.png`;
  fs.writeFileSync(imagePath, buffer, { encoding: 'binary' });

  callback(imagePath);
}

module.exports = { createCard };
