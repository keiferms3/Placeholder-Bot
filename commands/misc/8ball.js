import { SlashCommandBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Tests a basic command!'),
    async execute(interaction) {
        await interaction.reply(`What's up ${interaction.user.displayName}`)
    },
}