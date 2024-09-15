import { SlashCommandBuilder } from "discord.js"
import { Config, Users } from "../../database/objects.js"

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
        const points = interaction.options.getInteger('points')

        const maxPoints = await Config.getConfig(guild.id, 'maxPoints')
        const Top = await Users.getUser(user.id, guild.id)
        const Bottom = await Users.getUser(targetUser.id, guild.id)

        if (Top.points < points) {
            return `You do not have enough points`
        }
        if (maxPoints > -1 && (Bottom.points + points) > maxPoints) {
            return `Recipient cannot take such a large load`
        }
        
        Users.updateBalance(user.id, guild.id, (points * -1))
        Users.updateBalance(targetUser.id, guild.id, points)
        
        return `\`${user.globalName}\` paid \`${targetUser.globalName}\` \`${points} PP\``
    } catch (e) {
        console.error(e)
        return e
    }
}