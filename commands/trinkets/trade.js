import { SlashCommandBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('View the shop! Use /buy to '),
    async execute(interaction) {
        await interaction.reply(`What's up ${interaction.user.displayName}`)
    },
}