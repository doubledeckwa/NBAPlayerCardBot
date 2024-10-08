const axios = require('axios')
const sharp = require('sharp')
const { createCanvas, loadImage, registerFont } = require('canvas')
const fs = require('fs')

registerFont('./fonts/Unbounded-VariableFont_wght.ttf', { family: 'Unbounded' })

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

  // Настройка шрифта для имени
  ctx.font = 'regular 64px "Unbounded"'
  const name = data.name || 'LEPOOKIE'
  ctx.fillStyle = '#FDB927' // Фиолетовый цвет текста
  ctx.strokeStyle = '#552583' // Золотая окантовка
  const nameX = canvas.width / 2 - ctx.measureText(name).width / 2 // Центрирование
  ctx.strokeText(name, nameX, 610) // Окантовка для имени
  ctx.fillText(name, nameX, 610) // Позиция для имени

  // Отображение статистики
  const statLabels = [
    { key: 'PHY', x: 300, y: 665 },
    { key: 'INT', x: 300, y: 715 },
    { key: 'DRI', x: 300, y: 770 },
    { key: 'FT', x: 300, y: 850 },
    { key: 'PAS', x: 500, y: 665 },
    { key: 'THR', x: 500, y: 715 },
    { key: 'DEF', x: 500, y: 770 },
    { key: 'PPG', x: 500, y: 850 },
  ]

  const statValues = [
    { value: data.phy, x: 215, y: 665 },
    { value: data.int, x: 215, y: 715 },
    { value: data.dri, x: 215, y: 770 },
    { value: data.ft, x: 215, y: 850 },
    { value: data.pas, x: 435, y: 665 },
    { value: data.thr, x: 435, y: 715 },
    { value: data.def, x: 435, y: 770 },
    { value: data.ppg, x: 435, y: 850 },
  ]

  // Отрисовка значений
  ctx.font = '34px "Unbounded"'
  ctx.fillStyle = '#FDB927'
  ctx.strokeStyle = '#552583'
  statValues.forEach((stat) => {
    ctx.strokeText(`${stat.value}`, stat.x, stat.y)
    ctx.fillText(`${stat.value}`, stat.x, stat.y)
  })

  // Отрисовка лейблов
  ctx.font = '34px "Unbounded"'
  ctx.fillStyle = '#FDB927'
  ctx.strokeStyle = '#552583'
  statLabels.forEach((stat) => {
    ctx.strokeText(`${stat.key}`, stat.x, stat.y)
    ctx.fillText(`${stat.key}`, stat.x, stat.y)
  })

  // Сохранение изображения
  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync('card.png', buffer)
  callback('card.png')
}

module.exports = { createCard }
