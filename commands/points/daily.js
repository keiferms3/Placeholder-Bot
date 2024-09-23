import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { Config, Users } from "../../database/objects.js"
import { CheckCooldown, UpdateGachaChance } from "../../helpers.js"

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
        const config = await Config.getConfig(interaction.guild.id)
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
        if (!cooldown) {
            await Users.updateBalance(interaction.user.id, interaction.guild.id, config.dailyPoints)
            embed.setTitle(`:white_check_mark: Daily points redeemed! :white_check_mark:`)
                 .setDescription(`\`${config.dailyPoints} PP\` added to balance`)

        } else {
            embed.setTitle(`:x: Daily points on cooldown :x:`)
                 .setDescription(`Resets at <t:1726027200:t>`)
        }
        return { embeds: [embed] }
    } catch (e) {
        console.error(e)
        return e
    }
}