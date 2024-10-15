require('dotenv').config()
const { REST, Routes } = require('discord.js')

const commands = [
  {
    name: 'create_card',
    description: 'Create your very own player card',
    options: [
      {
        name: 'country',
        description: 'Enter your country, for help see FAQ',
        type: 3,
        required: true,
      },
    ],
  },
]

const rest = new REST({ version: '10' })
rest.setToken(process.env.BOT_TOKEN)(async () => {
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
