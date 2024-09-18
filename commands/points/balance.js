import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { Config, Users } from "../../database/objects.js"

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
        //Get trinket count here as well
        if (balance == undefined) {
            return `Balance not found for user "${user.globalName}"`
        }
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`${user.globalName}'s Balance`)
            .setDescription(`:coin:  \`Placeholder Points\` | \`${balance} PP\`  :coin:\n:trophy:  \`Total Trinkets\` |  \`${0} T1\` \`${2} T2\` \`${1} T3\`  :trophy:`)
        
        return {embeds: [embed]}
    } catch (e) {
        console.error(e)
        return e
    }
}