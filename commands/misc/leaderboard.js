import { EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config, Users } from "../../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Tests a basic command!')
        .addSubcommand(points => (
            points
            .setName('points')
            .setDescription('View the richest members of the server')
        )),
        // .addSubcommand(trinkets => (
        //     trinkets
        //     .setName('trinkets')
        //     .setDescription('View the greatest collectors in the server')
        // )),
    async execute(interaction) {
        const command = interaction.options.getSubcommand()
        if (command === 'points') {
            var response = await points(interaction)
        } else if (command === 'trinkets') {
            var response = await trinkets(interaction)
        }
        await interaction.reply(response)
    },
}

async function points(interaction) {
    const displayNum = 10
    const config = await Config.getConfig(interaction.guild.id)
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`:coin: Placeholder Point Leaderboard :coin:`)
    let desc = ''
    
    const users = await Users.getUser(null, interaction.guild.id)
    users.sort((a, b) => (b.points - a.points))
    await interaction.guild.members.fetch() //To create cache
    for (let i = 0; i < displayNum; i++) {
        if (!users[i]) { continue } //If server has less than 10 members lol
        const user = interaction.client.users.cache.get(users[i].userId) ?? {displayName: 'Unknown'}
        desc += `**${i+1}.** \`${user.displayName}\` \`${users[i].points} PP\`\n`
    }
    embed.setDescription(desc)
    return {embeds: [embed]}
}

async function trinkets(interaction) {
    
}