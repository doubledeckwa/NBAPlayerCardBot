async function askNextQuestion(interaction, userId, questions, activeSessions, createCard) {
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

  const numericFields = ['phy', 'int', 'dri', 'pas', 'thr', 'def', 'ft', 'ppg'];
  if (numericFields.includes(key)) {
    await interaction.followUp(`${question} (Enter a number between 1 and 99)`);
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
  } else {
    const input = response.content;

    if (numericFields.includes(key)) {
      const numValue = parseInt(input);
      if (isNaN(numValue) || numValue < 1 || numValue > 99) {
        await interaction.followUp('Invalid input! Please enter a number between 1 and 99.');
        return askNextQuestion(interaction, userId, questions, activeSessions, createCard);
      }
      session.data[key] = numValue; // Сохраняем валидное значение
    } else if (key === 'pos') {
      session.data[key] = input.toUpperCase(); // Преобразуем позицию в верхний регистр
    } else {
      session.data[key] = input;
    }
  }

  session.step++; // Переход к следующему вопросу только после корректного ввода
  activeSessions.set(userId, session);
  askNextQuestion(interaction, userId, questions, activeSessions, createCard);
}

module.exports = { askNextQuestion };
