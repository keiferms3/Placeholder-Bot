import { SlashCommandBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('Not yet implemented!!'),
    async execute(interaction) {
        await interaction.reply(`work in progress :(`)
    },
}