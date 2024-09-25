import { EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Check someone\'s trinket inventory')
        .addUserOption((user) => 
            user    
            .setName('user')
            .setDescription('The user who\'s inventory you wish to view'))
        .addStringOption((visible) => (
            visible
            .setName('visibility'))
            .setDescription('Whether the command\'s output should be visible to others or not (defaults to private)')
            .addChoices([{name: 'Public', value: 'public'}, {name: 'Private', value: 'private'}])),
    async execute(interaction) {
        const response = await inventory(interaction)
        await interaction.reply(response)
    },
}

//TODO: Add multiple pages to inventory, add featured trinkets
async function inventory(interaction) {
    try { 
        const user = interaction.options.getUser('user') ?? interaction.user
        const ephemeral = interaction.options.getString('visibility') === 'private' ? true : false
        const balance = await Users.getBalance(user.id, interaction.guild.id)
        const config = await Config.getConfig(interaction.guild.id)
        const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id, user.id)
        const tier1 = trinkets.filter(t => ( t.tier === 1 ))
        const tier2 = trinkets.filter(t => ( t.tier === 2 ))
        const tier3 = trinkets.filter(t => ( t.tier === 3 ))
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`:package: ${user.displayName}'s Inventory :package:`)
            
        let desc = `:coin: \`${balance} PP\` :coin:\n\n`

        if (tier3.length > 0) {
            desc += `:first_place: **${config.rarityNameT3}** :first_place:\n`
            for (const trinket of tier3) {
                desc += `${trinket.emoji}***\`${trinket.name}\`*** \`ID ${trinket.id}\`\n`
            }
            desc += '\n'
        }
        if (tier2.length > 0) {
            desc += `:second_place: **${config.rarityNameT2}** :second_place:\n`
            for (const trinket of tier2) {
                desc += `${trinket.emoji}**\`${trinket.name}\`** \`ID ${trinket.id}\`\n`
            }
            desc += '\n'
        }
        if (tier1.length > 0) {
            desc += `:third_place: **${config.rarityNameT1}** :third_place:\n`
            for (const trinket of tier1) {
                desc += `${trinket.emoji}\`${trinket.name}\` \`ID ${trinket.id}\`\n`
            }
        }
        embed.setDescription(desc)
        
        return {embeds: [embed], ephemeral: ephemeral}
    } catch (e) {
        console.error(e)
        return e
    }
}