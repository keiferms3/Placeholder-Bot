import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
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
        const config = await Config.getConfig(interaction.guild.id)
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
        if (!cooldown) {
            await Users.updateBalance(interaction.user.id, interaction.guild.id, config.weeklyPoints)
            embed.setTitle(`:white_check_mark: Weekly points redeemed! :white_check_mark:`)
                 .setDescription(`\`${config.weeklyPoints} PP\` added to balance`)

        } else {
            embed.setTitle(`:x: Weekly points on cooldown :x:`)
                 .setDescription(`Resets on Sunday at 12am EST (<t:1726027200:t>)`)
        }
        return { embeds: [embed] }
    } catch (e) {
        console.error(e)
        return e
    }
}