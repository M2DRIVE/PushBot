const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {

            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command.', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command.', flags: MessageFlags.Ephemeral });
                }
            }
        } else if (interaction.isButton()) {

            const customId = interaction.customId;
            if (customId === 'splitvc') {
                console.log(customId);
            } else if (customId === 'reroll') {
                const command = interaction.client.commands.get('rollteams');
                await command.execute(interaction);
            }
        }
    },
};