import { EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"

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

//TODO: Add multiple pages to inventory, add featured trinkets
async function inventory(interaction) {
    try { 
        const user = interaction.options.getUser('user') ?? interaction.user
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
                desc += `${trinket.emoji}\`${trinket.name}\` \`ID ${trinket.id}\`\n`
            }
        }
        desc += '\n'
        if (tier2.length > 0) {
            desc += `:second_place: **${config.rarityNameT2}** :second_place:\n`
            for (const trinket of tier2) {
                desc += `${trinket.emoji}\`${trinket.name}\` \`ID ${trinket.id}\`\n`
            }
        }
        desc += '\n'
        if (tier1.length > 0) {
            desc += `:third_place: **${config.rarityNameT1}** :third_place:\n`
            for (const trinket of tier1) {
                desc += `${trinket.emoji}\`${trinket.name}\` \`ID ${trinket.id}\`\n`
            }
        }
        embed.setDescription(desc)
        
        return {embeds: [embed]}
    } catch (e) {
        console.error(e)
        return e
    }
}