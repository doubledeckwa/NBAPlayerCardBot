const axios = require('axios')
const sharp = require('sharp')
const { createCanvas, loadImage, registerFont } = require('canvas')

const fs = require('fs')
const path = require('path')

// Регистрируем шрифт
registerFont('./fonts/Unbounded-VariableFont_wght.ttf', { family: 'Unbounded' })

function calculateOverallRating(data) {
  const stats = ['phy', 'int', 'dri', 'ft', 'pas', 'thr', 'def', 'ppg']
  const sum = stats.reduce((total, stat) => total + (parseInt(data[stat]) || 0), 0)
  return Math.round(sum / stats.length) // Average rounded to nearest integer
}

async function createCard(data, callback) {
  const canvas = createCanvas(800, 1000)
  const ctx = canvas.getContext('2d')
  const background = await loadImage('./template/template.png')
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height)

  // Загрузка фото игрока
  if (data.photo) {
    try {
      const response = await axios.get(data.photo, { responseType: 'arraybuffer' })
      const pngBuffer = await sharp(Buffer.from(response.data)).png().toBuffer()
      const userPhoto = await loadImage(pngBuffer)
      ctx.drawImage(userPhoto, 390, 150, 265, 265) // Позиция для фото игрока
    } catch (e) {
      console.error('Ошибка при загрузке изображения:', e)
    }
  }

  // Загрузка фото страны
  if (data.country) {
    try {
      const flagPath = path.join('./flags', `${data.country}.png`)
      console.log('Attempting to load flag from:', flagPath)
      if (fs.existsSync(flagPath)) {
        console.log('Flag file exists')
        const flagImage = await loadImage(flagPath)
        ctx.drawImage(flagImage, 185, 405, 100, 60) // Позиция для флага страны
        console.log('Flag drawn on canvas')
      } else {
        console.error('Файл флага не найден:', flagPath)
      }
    } catch (e) {
      console.error('Ошибка при загрузке флага страны:', e)
    }
  } else {
    console.log('No country data provided')
  }

  // Функция для отображения имени с динамическим изменением размера шрифта
  function drawName(ctx, name, maxWidth, yPosition) {
    let fontSize = 70 // Начальный размер шрифта
    ctx.font = `${fontSize}px "Unbounded"`

    let textWidth = ctx.measureText(name).width

    // Проверяем ширину текста и уменьшаем шрифт, если по бокам менее 50px
    while (textWidth > maxWidth - 275) {
      // Условие: 275px = 137.5px с каждой стороны
      fontSize -= 2 // Уменьшаем шрифт на 2px
      ctx.font = `${fontSize}px "Unbounded"`
      textWidth = ctx.measureText(name).width
    }

    const nameX = (maxWidth - textWidth) / 2 // Центрирование
    ctx.strokeStyle = 'rgba(85, 37, 131, 0.68)' // Stroke с прозрачностью 68%
    ctx.lineWidth = 6 // Толщина окантовки 6px для эффекта outside
    ctx.strokeText(name, nameX, yPosition) // Окантовка для имени
    ctx.fillStyle = '#FDB927' // Цвет текста FDB927
    ctx.fillText(name, nameX, yPosition) // Сам текст
  }

  // Пример использования для отрисовки имени
  const name = (data.name || 'LEPOOKIE').toUpperCase()
  drawName(ctx, name, canvas.width, 615) // Позиция для имени

  // Calculate overall rating
  const overallRating = calculateOverallRating(data)

  // Отображение статистики
  const statLabels = [
    { key: 'PHY', x: 300, y: 665 },
    { key: 'INT', x: 300, y: 715 },
    { key: 'DRI', x: 300, y: 770 },
    { key: 'FT', x: 300, y: 850 },
    { key: 'PAS', x: 500, y: 665 },
    { key: 'THR', x: 500, y: 715 },
    { key: 'DEF', x: 500, y: 770 },
    { key: 'PPG', x: 500, y: 845 },
  ]

  const statValues = [
    { value: overallRating, x: 185, y: 190, isLarge: true },
    { value: data.height, x: 185, y: 385 },
    { value: data.age, x: 185, y: 320 },
    { value: (data.pos || '').toUpperCase(), x: 185, y: 260, isLarge: true }, // POS
    { value: data.phy, x: 205, y: 665 },
    { value: data.int, x: 205, y: 715 },
    { value: data.dri, x: 205, y: 770 },
    { value: data.ft, x: 205, y: 850 },
    { value: data.pas, x: 415, y: 665 },
    { value: data.thr, x: 415, y: 715 },
    { value: data.def, x: 415, y: 770 },
    { value: data.ppg, x: 415, y: 845 },
  ]

  // Отрисовка значений
  statValues.forEach((stat) => {
    if (stat.isLarge) {
      ctx.font = '50px "Unbounded"'
      ctx.lineWidth = 6 // Толщина обводки для крупного текста
    } else {
      ctx.font = '30px "Unbounded"'
      ctx.lineWidth = 3
    }

    ctx.fillStyle = '#FDB927' // Цвет текста FDB927
    ctx.strokeStyle = 'rgba(85, 37, 131, 0.68)' // Stroke с прозрачностью 68%

    // Выравниваем текст по центру
    ctx.textAlign = 'center'

    ctx.strokeText(`${stat.value}`, stat.x + 50, stat.y) // Изменяем позицию текста
    ctx.fillText(`${stat.value}`, stat.x + 50, stat.y) // Изменяем позицию текста
  })

  // Отрисовка лейблов
  ctx.font = '30px "Unbounded"'
  ctx.fillStyle = '#FDB927' // Цвет текста FDB927
  ctx.strokeStyle = 'rgba(85, 37, 131, 0.68)' // Stroke с прозрачностью 68%
  ctx.textAlign = 'left' // Возвращаем выравнивание текста влево
  ctx.lineWidth = 3 // Толщина линии окантовки 2px для эффекта outside
  statLabels.forEach((stat) => {
    ctx.strokeText(`${stat.key}`, stat.x, stat.y)
    ctx.fillText(`${stat.key}`, stat.x, stat.y)
  })

  // Генерация имени файла
  const date = new Date()
  const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`

  const userName = name.replace(/\s+/g, '_') // Замена пробелов на подчеркивания
  const fileName = `${userName}_${formattedDate}.png`
  const resultPath = path.join(__dirname, 'result', fileName)

  // Сохранение изображения в папку result
  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(resultPath, buffer)
  callback(resultPath) // Возвращаем путь к сохраненному изображению

  const outputPath = path.join(__dirname, 'output', fileName)
  await canvas.saveAs(outputPath)
  return outputPath
}

module.exports = { createCard }
