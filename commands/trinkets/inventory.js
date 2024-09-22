import { SlashCommandBuilder } from "discord.js"
import { Users } from "../../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Check someone\'s inventory')
        .addUserOption((user) => 
            user    
            .setName('user')
            .setDescription('The user who\'s balance you wish to view')),
    async execute(interaction) {
        const response = await inventory(interaction)
        await interaction.reply(response)
    },
}

async function inventory(interaction) {
    try {
        const user = interaction.options.getUser('user') ?? interaction.user
        const balance = await Users.getBalance(user.id, interaction.guild.id)
        const embedColor = await Config.getConfig(interaction.guild.id, 'embedColor')
        //Get trinket count here as well
        if (balance == undefined) {
            return `Balance not found for user "${user.displayName}"`
        }
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`${user.displayName}'s Balance`)
            .setDescription(`:coin:  \`Placeholder Points\` | \`${balance} PP\`  :coin:\n:trophy:  \`Total Trinkets\` |  \`${0} T1\` \`${2} T2\` \`${1} T3\`  :trophy:`)
        
        return {embeds: [embed]}
    } catch (e) {
        console.error(e)
        return e
    }
}