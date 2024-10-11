require('dotenv').config()
const fs = require('fs')
const path = require('path')

const { REST, Routes } = require('discord.js')

const flagsDir = './flags'

const commands = [
  {
    name: 'create_card',
    description: 'Create your very own player card',
    options: [
      {
        name: 'country',
        description: 'Enter your country',
        type: 3, // STRING type
        required: true,
      },
    ],
  },
]

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN)(async () => {
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
