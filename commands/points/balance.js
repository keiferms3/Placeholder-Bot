import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check someone\'s point balance')
        .addUserOption((user) => 
            user    
            .setName('user')
            .setDescription('The user who\'s balance you wish to view')),
    async execute(interaction) {
        const response = await balance(interaction)
        await interaction.reply(response)
    },
}

async function balance(interaction) {
    try {
        const user = interaction.options.getUser('user') ?? interaction.user
        const balance = await Users.getBalance(user.id, interaction.guild.id)
        const embedColor = await Config.getConfig(interaction.guild.id, 'embedColor')
        const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id, user.id)
        const tier1 = trinkets.filter(t => ( t.tier === 1 ))
        const tier2 = trinkets.filter(t => ( t.tier === 2 ))
        const tier3 = trinkets.filter(t => ( t.tier === 3 ))
        

        if (balance == undefined) {
            return `Balance not found for user "${user.displayName}"`
        }

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`${user.displayName}'s Balance`)
            .setDescription(`:coin:  \`Placeholder Points\` | \`${balance} PP\`  :coin:\n:trophy:  \`Total Trinkets\` |  \`${tier1.length} T1\` \`${tier2.length} T2\` \`${tier3.length} T3\`  :trophy:`)
        
        return {embeds: [embed]}
    } catch (e) {
        console.error(e)
        return e
    }
}