import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
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
        
        const config = await Config.getConfig(guild.id)
        const Top = await Users.getUser(user.id, guild.id)
        const Bottom = await Users.getUser(targetUser.id, guild.id)
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)

        if (points < 0) {
            embed.setTitle(`:x: You cannot pay negative amounts :x:`)
                 .setDescription(`Kill yourself ryan`)
        }
        else if (Top.points < points) {
            embed.setTitle(`:x: You do not have enough points :x:`)
                 .setDescription(`Cannot pay \`${points} PP\`, \`${user.displayName}\` only has \`${Top.points} PP\``)

        } else if (config.maxPoints > -1 && (Bottom.points + points) > config.maxPoints) {
            embed.setTitle(`:x: Recipient cannot take such a large load :x:`)
                 .setDescription(`This transaction would exceed the \`${config.maxPoints} PP\` max limit`)

        } else {
            Users.updateBalance(Top.userId, Top.guildId, (points * -1))
            Users.updateBalance(Bottom.userId, Bottom.guildId, points)
            
            embed.setTitle(`:white_check_mark: Payment successful! :white_check_mark:`)
                 .setDescription(`\`${user.displayName}\` paid \`${targetUser.displayName}\` \`${points} PP\``)
        }
        return {embeds: [embed]}
        
    } catch (e) {
        console.error(e)
        return e
    }
}