require('dotenv').config()

const { REST, Routes } = require('discord.js')

const commands = [
  {
    name: 'create_card',
    description: 'Create your own player card',
  },
]

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Начинаю регистрацию команды /create_card.')

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    )
    console.log('Команда успешно зарегистрирована.')

  } catch (error) {
    console.error('Ошибка при регистрации команды:', error)
  }
})()
