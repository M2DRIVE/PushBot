const { SlashCommandBuilder } = require("discord.js");

module.exports = { 
    data : new SlashCommandBuilder()
        .setName('rollteams')
        .setDescription('Randomly creates balanced teams based on players\' preferred roles.'),
    async execute(interaction) {
        await interaction.reply('');
    },
};

