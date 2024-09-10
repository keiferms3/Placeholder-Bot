import { SlashCommandBuilder, Collection } from "discord.js"
import { Users } from "../database/users/users-object.js"

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
        const user = interaction.user.id
        const guild = interaction.guild.id
        const guildCooldowns = interaction.client.cooldowns.get('daily')

        if (!guildCooldowns.get(guild)) {
            guildCooldowns.set(guild, new Collection())
        }
        const cooldowns = guildCooldowns.get(guild)
        if (!cooldowns.get(user)) {
            await Users.updateBalance(user, guild, 5, 20)
            cooldowns.set(user, true)
            return 'Daily points redeemed!'
        } else {
            return 'Daily points on cooldown, resets at 12am EST!'
        }
    } catch (e) {
        return e
    }
}