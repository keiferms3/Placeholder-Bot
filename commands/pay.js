import { SlashCommandBuilder } from "discord.js"
import { Users } from "../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription('Pay another user Placeholder Points')
        .addUserOption((user) => 
            user
            .setName('user')
            .setDescription('The user you want to pay')
            .setRequired(true))
        .addIntegerOption((points) =>
            points
            .setName('points')
            .setDescription('Amount of points to pay')
            .setRequired(true)),
    async execute(interaction) {
        const response = await balance(interaction)
        await interaction.reply(response)
    },
}

async function balance(interaction) {
    try {
        const user = interaction.user
        const guild = interaction.guild
        const targetUser = interaction.options.getUser('user')
        const points = interaction.options.getUser('points')
        
        const Top = await Users.getUser(user.id, guild.id)
        const Bottom = await Users.getUser(targetUser.id, guild.id)

        if (Top.points + Top.gifts < points) {
            return `You do not have enough points`
        }
        
        Users.updateBalance(user.id, guild.id)
        return ``
    } catch (e) {
        return e
    }
}