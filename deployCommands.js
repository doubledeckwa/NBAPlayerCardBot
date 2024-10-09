require('dotenv').config()
const fs = require('fs')
const path = require('path')

const { REST, Routes } = require('discord.js')

const flagsDir = './flags'
const availableFlags = fs
  .readdirSync(flagsDir)
  .filter((file) => file.endsWith('.png'))
  .map((file) => path.parse(file).name)
  .slice(0, 25) // Ограничиваем количество флагов до 25

const commands = [
  {
    name: 'create_card',
    description: 'Create your very own player card',
    options: [
      {
        name: 'country',
        description: 'Enter your country (or type "list" to see available options)',
        type: 3, // STRING type
        required: true,
      },
    ],
  },
]

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN)

;(async () => {
  try {
    console.log('Начинаю регистрацию команды /create_card.')

    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
      body: commands,
    })

    console.log('Команда успешно зарегистрирована.')
  } catch (error) {
    console.error('Ошибка при регистрации команды:', error)
  }
})()
