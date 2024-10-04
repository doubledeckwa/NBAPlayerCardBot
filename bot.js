// TODO: split this code into separate files

require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')
const { createCanvas, loadImage, registerFont } = require('canvas')
const axios = require('axios')
const fs = require('fs')
const sharp = require('sharp')

const token = process.env.BOT_TOKEN
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

registerFont('./fonts/Unbounded-VariableFont_wght.ttf', { family: 'Unbounded' })

let activeSessions = new Map() // Очень круто сохраняем пользователей

client.once('ready', () => {
  console.log('bot is ready')
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand() || interaction.commandName !== 'create_card') return

  if (interaction.commandName === 'create_card') {
    if (!interaction.isCommand() || interaction.commandName !== 'create_card') return

    const userId = interaction.user.id

    // If session exists, reset it, otherwise create a new session
    if (activeSessions.has(userId)) {
      activeSessions.delete(userId)
      await interaction.reply("Session has been reset. Let's start over.")
    } else {
      await interaction.reply("Let's create your card!")
    }
    activeSessions.set(userId, { step: 0, data: {} })

    // Questions to be asked
    const questions = [
      { key: 'name', question: 'What is your name?' }, // New question for name
      { key: 'pos', question: 'What is your position?' },
      { key: 'age', question: 'How old are you?' },
      { key: 'height', question: 'What is your height (in feet)?' },
      { key: 'phy', question: 'What is your physical strength (PHY)?' },
      { key: 'int', question: 'What is your intelligence (INT)?' },
      { key: 'dri', question: 'What is your dribbling skill (DRI)?' },
      { key: 'pas', question: 'What is your passing skill (PAS)?' },
      { key: 'thr', question: 'How good are you at three-pointers (THR)?' },
      { key: 'def', question: 'How good is your defense (DEF)?' },
      { key: 'ft', question: 'What is your free throw (FT) accuracy?' },
      { key: 'ppg', question: 'How many points per game (PPG) do you score?' },
      {
        key: 'photo',
        question:
          'Please upload a photo for the card. (Send any character in case you want to use it)',
      },
    ]

    askNextQuestion(interaction, userId, questions) // Start with the first question
  }
})

// Function to ask the next question
async function askNextQuestion(interaction, userId, questions) {
  const session = activeSessions.get(userId);
  if (!session) return;

  const currentStep = session.step;
  if (currentStep >= questions.length) {
    await interaction.followUp('Creating the card...');
    return createCard(session.data, async (imagePath) => {
      await interaction.followUp({ files: [imagePath] });
      activeSessions.delete(userId);
    });
  }

  const { key, question } = questions[currentStep];
  await interaction.followUp(question);

  const filter = (response) => response.author.id === userId;
  const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 600000 });
  const response = collected.first();

  if (key === 'photo') {
    if (response.content === 'no') {
      session.data[key] = interaction.user.displayAvatarURL({ format: 'jpg', size: 512 });
    } else if (response.attachments.first()) {
      session.data[key] = response.attachments.first().url;
    } else {
      await interaction.followUp('You need to upload an image.');
      activeSessions.delete(userId);
      return;
    }
  } else {
    session.data[key] = response.content;
  }

  session.step++;
  activeSessions.set(userId, session);
  askNextQuestion(interaction, userId, questions);
}

async function createCard(data, callback) {
  const canvas = createCanvas(800, 1000);
  const ctx = canvas.getContext('2d');
  const background = await loadImage('./template/template.png');
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  if (data.photo) {
    try {
      const response = await axios.get(data.photo, { responseType: 'arraybuffer' });
      const pngBuffer = await sharp(Buffer.from(response.data)).png().toBuffer();
      const userPhoto = await loadImage(pngBuffer);
      ctx.drawImage(userPhoto, 300, 150, 200, 200);
    } catch (e) {
      console.error('Error loading image:', e);
    }
  }

  // Настройка шрифта для имени
  let fontSize = 64
  const maxWidth = canvas.width - 300 // Максимальная доступная ширина с отступами 50px с каждой стороны
  const name = data.name || 'LEPOOKIE'

  // Уменьшаем размер шрифта, пока текст не станет помещаться в отведенную ширину
  do {
    ctx.font = `bold ${fontSize}px "Unbounded"`
    var textWidth = ctx.measureText(name).width
    fontSize -= 2 // Уменьшаем шрифт постепенно
  } while (textWidth > maxWidth && fontSize > 10) // Ограничиваем минимальный размер шрифта

  // ## Вычисляем координаты по центру (центр холста - половина ширины текста)
  const xCenter = canvas.width / 2 - textWidth / 2
  const yPosition = 610 // Y координата чуть выше горизонтальной линии

  // Задаем обводку для текста (для внешнего контура)
  ctx.lineWidth = 8
  ctx.strokeStyle = '#552583' // Внешний контур (фиолетовый)

  // Задаем заливку текста (для внутренней части)
  ctx.fillStyle = '#FDB927' // Внутренний цвет (желтый)

  // Рисуем текст с обводкой и заливкой
  ctx.strokeText(name, xCenter, yPosition) // Обводка
  ctx.fillText(name, xCenter, yPosition) // Заливка

  // ## Рассчитываем общий рейтинг
  const stats = [data.phy, data.int, data.dri, data.pas, data.thr, data.def, data.ft, data.ppg]

  const sum = stats.reduce((acc, stat) => acc + parseInt(stat), 0) // Сумма всех атрибутов

  let overallRating = Math.floor(sum / stats.length) // Среднее значение

  // Ограничиваем общий рейтинг максимумом 99
  if (overallRating > 99) {
    overallRating = 99
  }

  // Отображаем Overall Rating
  ctx.font = 'bold 44px "Unbounded"'
  ctx.fillStyle = '#FFFFFF' // Белый цвет для Overall Rating
  ctx.fillText(`${overallRating}`, 170, 220) // Расположение над POS

  // Настройка текста для остальных полей (цвет, шрифт и т.д.)
  ctx.font = '34px "Unbounded"'
  ctx.fillStyle = '#FFFFFF' // Белый цвет для остальных значений

  // Позиционные данные
  ctx.fillText(`${data.pos}`, 170, 270)
  ctx.fillText(`${data.age}`, 170, 320)
  ctx.fillText(`${data.height}′`, 170, 370)

  // Bottom-left stats
  ctx.fillText(`${data.phy}  PHY`, 180, 670)
  ctx.fillText(`${data.int}  INT`, 180, 720)
  ctx.fillText(`${data.dri}  DRI`, 180, 770)
  ctx.fillText(`${data.pas}  PAS`, 180, 840)

  // Bottom-right stats
  ctx.fillText(`${data.thr}  THR`, 435, 670)
  ctx.fillText(`${data.def}  DEF`, 435, 720)
  ctx.fillText(`${data.ft}  FT`, 435, 770)
  ctx.fillText(`${data.ppg}  PPG`, 435, 840)

  // ## Сохранение изображения
  const buffer = canvas.toBuffer('image/png');
  const imagePath = `./result/${Date.now()}.png`;
  fs.writeFileSync(imagePath, buffer, { encoding: 'binary' });

  callback(imagePath);
}

client.login(token)
