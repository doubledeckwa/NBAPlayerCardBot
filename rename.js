const fs = require('fs')
const path = require('path')
const { getName } = require('country-list')

// Путь к папке с флагами
const flagsFolder = 'flags'

// Читаем содержимое папки
fs.readdir(flagsFolder, (err, files) => {
  if (err) {
    console.error('Ошибка при чтении папки:', err)
    return
  }

  files.forEach((filename) => {
    if (path.extname(filename).toLowerCase() === '.png') {
      // Получаем код страны (предполагаем, что он соответствует имени файла без расширения)
      const countryCode = path.basename(filename, '.png')

      // Получаем полное название страны
      const countryName = getName(countryCode)

      if (countryName) {
        // Формируем новое имя файла
        const newFilename = `${countryName}.png`

        // Полные пути к старому и новому файлу
        const oldPath = path.join(flagsFolder, filename)
        const newPath = path.join(flagsFolder, newFilename)

        // Переименовываем файл
        fs.rename(oldPath, newPath, (err) => {
          if (err) {
            console.error(`Ошибка при переименовании ${filename}:`, err)
          } else {
            console.log(`Переименован: ${filename} -> ${newFilename}`)
          }
        })
      } else {
        console.log(`Страна не найдена для кода: ${countryCode}`)
      }
    }
  })
})
