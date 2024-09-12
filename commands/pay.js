import { SlashCommandBuilder } from "discord.js"
import { Config, Users } from "../database/objects.js"

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
        const response = await pay(interaction)
        await interaction.reply(response)
    },
}

async function pay(interaction) {
    try {
        const user = interaction.user
        const guild = interaction.guild
        const targetUser = interaction.options.getUser('user')
        const points = interaction.options.getUser('points')

        const config = Config.getConfig(guild.id)
        const Top = await Users.getUser(user.id, guild.id)
        const Bottom = await Users.getUser(targetUser.id, guild.id)

        if (Top.points < points) {
            return `You do not have enough points`
        }
        if (Bottom.points + points > config.maxPoints) {
            return `Recipient cannot take such a large load` //This error message will probably never be sent so hi whoever's reading the code
        }
        
        Users.updateBalance(user.id, guild.id)
        return ``
    } catch (e) {
        return e
    }
}