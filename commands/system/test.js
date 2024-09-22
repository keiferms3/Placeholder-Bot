import { SlashCommandBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Tests a basic command!'),
    async execute(interaction) {
        const response = await test(interaction)
        await interaction.reply(response)
    },
}

async function test(interaction) {
    return `What's up ${interaction.user.displayName}`
}