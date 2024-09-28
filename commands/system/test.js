import { SlashCommandBuilder } from "discord.js"
import { forgeReward } from "../trinkets/trinket-gacha.js"
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
    const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id)
    for (let trinket of trinkets) {
        if (!trinket.ownerId.startsWith('gacha')) {
            await forgeReward(trinket, interaction)
        }
    }
    return 'FORGEMASTERS BE BLESSED!'
    
}