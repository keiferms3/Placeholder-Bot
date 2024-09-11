import { SlashCommandBuilder } from "discord.js"
import { Config } from "../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Tests a basic command!'),
    async execute(interaction) {
        await interaction.reply(`What's up ${interaction.user.username}`)
    },
}