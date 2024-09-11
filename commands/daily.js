import { SlashCommandBuilder, Collection } from "discord.js"
import { Config, Users } from "../database/objects.js"

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
        const userId = interaction.user.id
        const guildId = interaction.guild.id
        const guildCooldowns = interaction.client.cooldowns.get('daily')

        if (!guildCooldowns.get(guildId)) {
            guildCooldowns.set(guildId, new Collection())
        }

        const cooldowns = guildCooldowns.get(guildId)
        if (!cooldowns.get(userId)) {
            const config = await Config.getOption(guildId)
            await Users.updateBalance(userId, guildId, config.dailyPoints, config.dailyGifts)
            cooldowns.set(userId, true)
            return 'Daily points redeemed!'
        } else {
            return 'Daily points on cooldown, resets at 12am EST!'
        }
    } catch (e) {
        return e
    }
}