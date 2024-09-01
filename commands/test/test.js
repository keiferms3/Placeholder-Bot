import { SlashCommandBuilder } from "discord.js"

export const command = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Tests a basic command!'),
    async execute(interaction) {
        await interaction.reply(`What's up ${interaction.user.username}`)
    },
}