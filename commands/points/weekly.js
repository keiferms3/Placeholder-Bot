import { SlashCommandBuilder } from "discord.js"
import { Config, Users } from "../../database/objects.js"
import { CheckCooldown } from "../../helpers.js"

export default {
    data: new SlashCommandBuilder()
        .setName('weekly')
        .setDescription('Grants more free points, resets every sunday at midnight.'),
    async execute(interaction) {
        try {
            const response = await weekly(interaction)
            await interaction.reply(response)
        } catch (e) {
            await interaction.reply(e)
            console.error(e)
        }
        
    },
}

async function weekly(interaction) {
    try {
        const cooldown = await CheckCooldown('weekly', interaction)
        if (!cooldown) {
            const weeklyPoints = await Config.getConfig(interaction.guild.id, 'weeklyPoints')
            await Users.updateBalance(interaction.user.id, interaction.guild.id, weeklyPoints)
            return `Weekly points redeemed! \`${weeklyPoints} Placeholder Points\` added to balance`
            
        } else {
            return 'Weekly points on cooldown, resets on Sunday at 12am EST! (<t:1726027200:t> local time)'
            
        }
    } catch (e) {
        console.error(e)
        return e
    }
}