require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')
const { askNextQuestion } = require('./session') // Импортируем функции из session.js
const { createCard } = require('./card') // Импортируем функции из card.js

const token = process.env.BOT_TOKEN

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

let activeSessions = new Map() // Очень круто сохраняем пользователей

client.once('ready', () => {
  console.log('Bot is ready')
})

client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isCommand() || interaction.commandName !== 'create_card') return

    const userId = interaction.user.id
    const selectedCountry = interaction.options.getString('country')

    // Если сессия существует, сбрасываем ее, иначе создаем новую сессию
    if (activeSessions.has(userId)) {
      activeSessions.delete(userId)
      await interaction.reply("Session has been reset. Let's start over.")
    } else {
      await interaction.reply("Let's create your card!")
    }
    activeSessions.set(userId, { step: 0, data: { country: selectedCountry } })

    // Вопросы для пользователя
    const questions = [
      {
        key: 'name',
        question: 'What is your name ?',
      },
      { key: 'pos', question: 'What is your position ?' },
      { key: 'age', question: 'How old are you ?' },
      { key: 'height', question: 'What is your height (in feet) ?' },
      { key: 'phy', question: 'What is your physical strength (PHY) ?' },
      { key: 'int', question: 'What is your intelligence (INT) ?' },
      { key: 'dri', question: 'What is your dribbling skill (DRI) ?' },
      { key: 'pas', question: 'What is your passing skill (PAS) ?' },
      { key: 'thr', question: 'How good are you at three-pointers (THR) ?' },
      { key: 'def', question: 'How good is your defense (DEF) ?' },
      { key: 'ft', question: 'What is your free throw (FT) accuracy ?' },
      { key: 'ppg', question: 'How many points per game (PPG) do you score ?' },
      {
        key: 'photo',
        question:
          'Please upload a photo for the card. (Send `NO` character in case you want to use your own Discord avatar.)',
      },
    ]

    // Запускаем следующий вопрос
    askNextQuestion(interaction, userId, questions, activeSessions, createCard)
  } catch (error) {
    console.error('Ошибка при обработке взаимодействия:', error)
    await interaction.reply('Ошибка при обработке взаимодействия. Пожалуйста, попробуйте еще раз.')
  }
})

client.login(token).catch((error) => {
  console.error('Ошибка при входе в систему:', error)
})
