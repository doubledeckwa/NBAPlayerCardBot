const fs = require('fs')
const path = require('path')

// Функция для следующего вопроса
async function askNextQuestion(interaction, userId, questions, activeSessions, createCard) {
  try {
    const session = activeSessions.get(userId);
    if (!session) return;

    const currentStep = session.step;
    if (currentStep >= questions.length) {
      await interaction.followUp('Creating the card...');
      return createCard(session.data, async (imagePath) => {
        if (!fs.existsSync(imagePath)) {
          throw new Error('Image path does not exist');
        }
        await interaction.followUp({ files: [imagePath] });
        activeSessions.delete(userId);
      });
    }

    const { key, question } = questions[currentStep];

    const numericFields = ['phy', 'int', 'dri', 'pas', 'thr', 'def', 'ft', 'ppg'];
    if (numericFields.includes(key)) {
      await interaction.followUp(`${question} (Enter a number between 1 and 99)`);
    } else if (key === 'country') {
      await interaction.followUp(`${question} (Send country name, check FAQ for help)`);
    } else {
      await interaction.followUp(question);
    }

    const filter = (response) => response.author.id === userId;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 600000 });
    const response = collected.first();

    if (!response) {
      await interaction.followUp('You did not respond in time. Session ended.');
      activeSessions.delete(userId);
      return;
    }

    if (key === 'photo') {
      if (response.content === 'no' || !response.attachments.first()) {
        session.data[key] = interaction.user.displayAvatarURL({ format: 'jpg', size: 512 });
      } else if (response.attachments.first()) {
        session.data[key] = response.attachments.first().url;
      }
    } else if (key === 'country') {
      const flagsDir = './flags';
      const availableFlags = fs.readdirSync(flagsDir)
        .filter(file => file.endsWith('.png'))
        .map(file => path.parse(file).name);

      if (response.content.toLowerCase() === 'list') {
        await interaction.followUp(`Доступные страны: ${availableFlags.join(', ')}`);
        return askNextQuestion(interaction, userId, questions, activeSessions, createCard);
      }

      if (!availableFlags.includes(response.content.toLowerCase())) {
        await interaction.followUp('Неверное название страны. Попробуйте еще раз или отправьте "list" для просмотра доступных стран.');
        return askNextQuestion(interaction, userId, questions, activeSessions, createCard);
      }

      session.data[key] = response.content.toLowerCase();
    } else {
      const input = response.content;

      if (numericFields.includes(key)) {
        const numValue = parseInt(input);
        if (isNaN(numValue) || numValue < 1 || numValue > 99) {
          await interaction.followUp('Invalid input! Please enter a number between 1 and 99.');
          return askNextQuestion(interaction, userId, questions, activeSessions, createCard);
        }
        session.data[key] = numValue;
      } else if (key === 'pos') {
        const validPositions = ['PG', 'SG', 'SF', 'PF', 'C'];
        if (!validPositions.includes(input.toUpperCase())) {
          await interaction.followUp('Invalid position! Please enter one of the following: PG, SG, SF, PF, C.');
          return askNextQuestion(interaction, userId, questions, activeSessions, createCard);
        }
        session.data[key] = input.toUpperCase();
      } else {
        session.data[key] = input;
      }
    }

    session.step++;
    activeSessions.set(userId, session); // Сохраняем обновленную сессию
    await askNextQuestion(interaction, userId, questions, activeSessions, createCard);
  } catch (error) {
    console.error(error);
    await interaction.followUp('Произошла ошибка при обработке вашего ответа. Попробуйте еще раз.');
  }
}

module.exports = { askNextQuestion }