require('dotenv').config()
const { Client, GatewayIntentBits } = require('discord.js')
const { askNextQuestion } = require('./session') // Импортируем функции из session.js
const { createCard } = require('./card') // Импортируем функции из card.js
const questions = require('./questions')

const token = process.env.BOT_TOKEN

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

let activeSessions = new Map()

client.once('ready', () => {
  console.log('Bot is ready')
})

client.on('interactionCreate', async (interaction) => {
  try {
    if (!interaction.isCommand() || interaction.commandName !== 'create_card') return

    const userId = interaction.user.id
    const selectedCountry = interaction.options.getString('country')
    const selectedTeam = interaction.options.getString('team')

    // Если сессия существует, сбрасываем ее, иначе создаем новую сессию
    if (activeSessions.has(userId)) {
      activeSessions.delete(userId)
      await interaction.reply("Session has been reset. Let's start over.")
    } else {
      await interaction.reply("Let's create your card!")
    }
    activeSessions.set(userId, { step: 0, data: { country: selectedCountry, team: selectedTeam } })

    // Запускаем следующий вопрос
    askNextQuestion(interaction, userId, questions, activeSessions, async (cardPath) => {
      // Отправляем карточку
      await interaction.followUp({ files: [cardPath] });

      // Создаем кнопки
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('yes')
            .setLabel('✅')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('no')
            .setLabel('❌')
            .setStyle(ButtonStyle.Danger)
        );

      // Отправляем сообщение с вопросом и кнопками
      const questionMessage = await interaction.followUp({
        content: 'Ты доволен своей карточкой?',
        components: [row]
      });

      // Создаем коллектор для ожидания нажатия кнопки
      const filter = i => i.user.id === userId && ['yes', 'no'].includes(i.customId);
      const collector = questionMessage.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async i => {
        if (i.customId === 'yes') {
          const role = interaction.guild.roles.cache.find(role => role.name === 'BronCard');
          if (role) {
            await interaction.member.roles.add(role);
            await i.update({ content: 'Отлично! Вам выдана роль BronCard.', components: [] });
          } else {
            await i.update({ content: 'Роль BronCard не найдена на сервере.', components: [] });
          }
        } else {
          await i.update({ content: 'Понял, спасибо за отзыв!', components: [] });
        }
        collector.stop();
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.followUp('Время ожидания ответа истекло.');
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при обработке взаимодействия:', error)
    await interaction.reply('Ошибка при обработке взаимодействия. Пожалуйста, попробуйте еще раз.')
  }
})

client.login(token).catch((error) => {
  console.error('Ошибка при входе в систему:', error)
})