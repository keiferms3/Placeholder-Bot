import { SlashCommandBuilder } from "discord.js"
import { Trinkets } from "../../database/objects.js"

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
    const trinkets = await Trinkets.getTrinkets()
    for (const trinket of trinkets) {
        trinket.trinketId = trinket.id
        await trinket.save()
    }
    return `What's up ${interaction.user.displayName}`
}