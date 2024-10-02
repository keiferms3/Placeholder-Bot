import { SlashCommandBuilder, EmbedBuilder, Collection } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check someone\'s point balance')
        .addUserOption((user) => (
            user    
            .setName('user')
            .setDescription('The user who\'s balance you wish to view')))
        .addBooleanOption((visible) => (
            visible
            .setName('hidden'))
            .setDescription('If true, command\'s output will not be visible to others')),
    async execute(interaction) {
        const response = await balance(interaction)
        await interaction.reply(response)
    },
}

async function balance(interaction) {
    try {
        const user = interaction.options.getUser('user') ?? interaction.user
        const ephemeral = interaction.options.getBoolean('hidden')

        const config = await Config.getConfig(interaction.guild.id)
        const balance = await Users.getBalance(user.id, interaction.guild.id)
        const trinketsOwned = await Trinkets.getTrinkets(undefined, interaction.guild.id, user.id)
        const trinketsCreated = await Trinkets.getTrinkets(undefined, interaction.guild.id, undefined, user.id)

        const ownedCount = [0, 0, 0]
        trinketsOwned.map(t => ownedCount[t.tier-1]++)

        const createdCount = [0, 0, 0]
        trinketsCreated.map(t => createdCount[t.tier-1]++)

        if (balance == undefined) {
            return `Balance not found for user "${user.displayName}"`
        }

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${user.displayName}'s Balance`)
            .setDescription(`:coin:  \`Placeholder Points\` | \`${balance} PP\`  :coin:\n:trophy:  \`Total Trinkets\` |  \`${ownedCount[0]} ${config.rarityNameT1}\` \`${ownedCount[1]} ${config.rarityNameT2}\` \`${ownedCount[2]} ${config.rarityNameT3}\`  :trophy:\n :hammer_pick:  \`Total Forged\` | \`${createdCount[0]} ${config.rarityNameT1}\` \`${createdCount[1]} ${config.rarityNameT2}\` \`${createdCount[2]} ${config.rarityNameT3}\`  :hammer_pick:`)

        return {embeds: [embed], ephemeral: ephemeral}
    } catch (e) {
        console.error(e)
        return e
    }
}