import { EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"
import { handlePages } from "../../helpers.js"

export default {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Check someone\'s trinket inventory')
        .addUserOption((user) => 
            user    
            .setName('user')
            .setDescription('The user who\'s inventory you wish to view'))
        .addBooleanOption((visible) => (
            visible
            .setName('hidden'))
            .setDescription('If true, command\'s output will not be visible to others')),
    async execute(interaction) {
        const response = await inventory(interaction)
        await interaction.reply(response)
    },
}

//TODO: Add multiple pages to inventory, add featured trinkets
async function inventory(interaction) {
    try { 
        const user = interaction.options.getUser('user') ?? interaction.user
        const ephemeral = interaction.options.getBoolean('hidden')
        const balance = await Users.getBalance(user.id, interaction.guild.id)
        const config = await Config.getConfig(interaction.guild.id)
        const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id, user.id)
        const tier1 = trinkets.filter(t => ( t.tier === 1 ))
        const tier2 = trinkets.filter(t => ( t.tier === 2 ))
        const tier3 = trinkets.filter(t => ( t.tier === 3 ))
            
        let desc = `:coin: \`${balance} PP\` :coin:\n\n`

        if (tier3.length > 0) {
            desc += `**--- ${config.rarityNameT3} ---**\n`
            for (const trinket of tier3) {
                desc += `${trinket.emoji}***\`${trinket.name}\`*** \`ID ${trinket.trinketId}\`\n`
            }
            desc += '\n'
        }
        if (tier2.length > 0) {
            desc += `**--- ${config.rarityNameT2} ---**\n`
            for (const trinket of tier2) {
                desc += `${trinket.emoji}**\`${trinket.name}\`** \`ID ${trinket.trinketId}\`\n`
            }
            desc += '\n'
        }
        if (tier1.length > 0) {
            desc += `**--- ${config.rarityNameT1} ---**\n`
            for (const trinket of tier1) {
                desc += `${trinket.emoji}\`${trinket.name}\` \`ID ${trinket.trinketId}\`\n`
            }
        }

        const CHUNK_SIZE = 800
        const chunkCount = Math.ceil(desc.length / CHUNK_SIZE)
        const pages = []
        let index = 0
        for (let i = 0; i < chunkCount; i++) {
            const embed = new EmbedBuilder().setColor(config.embedColor)
            const lastIndex = index
            index = desc.indexOf('\n', (i+1)*CHUNK_SIZE) 
            index = (index === -1) ? (i+1)*CHUNK_SIZE : index + 1

            pages.push(desc.substring(lastIndex, index))
        }

        await handlePages(`${user.displayName}'s Inventory`, pages, interaction)
        
    } catch (e) {
        console.error(e)
        return e
    }
}
