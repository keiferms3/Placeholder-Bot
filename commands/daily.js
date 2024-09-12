import { SlashCommandBuilder, Collection } from "discord.js"
import { Config, Users } from "../database/objects.js"
import { CheckCooldown } from "../helpers.js"

export default {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Grants free points, resets every day at midnight.'),
    async execute(interaction) {
        try {
            const response = await daily(interaction)
            await interaction.reply(response)
        } catch (e) {
            await interaction.reply(e)
            console.error(e)
        }
        
    },
}

async function daily(interaction) {
    try {
        const cooldown = await CheckCooldown('daily', interaction)
        if (!cooldown) {
            const dailyPoints = await Config.getConfig(interaction.guild.id, 'dailyPoints')
            await Users.updateBalance(interaction.user.id, interaction.guild.id, dailyPoints)
            return `Daily points redeemed! \`${dailyPoints} Placeholder Points\` added to balance`
            
        } else {
            return 'Daily points on cooldown, resets at <t:1726027200:t>!'
            
        }
    } catch (e) {
        return e
    }
}