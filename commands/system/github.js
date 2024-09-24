import { SlashCommandBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName('github')
        .setDescription('Go to the bot\'s github repository'),
    async execute(interaction) {
        const response = await test()
        await interaction.reply(response)
    },
}

async function test() {
    return `Yo this bot's open source!! View the source code and contribute at https://github.com/keiferms3/Placeholder-Bot`
}