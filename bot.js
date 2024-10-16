require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { askNextQuestion } = require('./session'); // Импортируем функции из session.js
const { createCard } = require('./card'); // Импортируем функции из card.js
const questions = require('./questions');

const token = process.env.BOT_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let activeSessions = new Map();

client.once('ready', () => {
  console.log('Bot is ready');
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isCommand() || interaction.commandName !== 'create_card') return;

    const userId = interaction.user.id;
    const selectedCountry = interaction.options.getString('country');
    const selectedTeam = interaction.options.getString('team');

    if (activeSessions.has(userId)) {
      activeSessions.delete(userId);
      await interaction.reply("Session has been reset. Let's start over.");
    } else {
      await interaction.reply("Let's create your card!");
    }

    // Запускаем следующий вопрос
    if (!activeSessions.has(userId)) {
      activeSessions.set(userId, { step: 0, data: { country: selectedCountry, team: selectedTeam }, inProgress: true });
      await askNextQuestion(interaction, userId, questions, activeSessions, createCard);
    }
  } catch (error) {
    console.error('Ошибка при обработке взаимодействия:', error);
    await interaction.reply('Ошибка при обработке взаимодействия. Пожалуйста, попробуйте еще раз.');
  }
});

client.login(token).catch((error) => {
  console.error('Ошибка при входе в систему:', error);
});