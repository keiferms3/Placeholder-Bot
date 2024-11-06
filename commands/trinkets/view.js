import { EmbedBuilder } from "discord.js"
import { Config, Trinkets } from "../../database/objects.js"
import { forgeReward } from "./trinket-gacha.js"

export async function view(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const id = interaction.options.getInteger('id')
    let ephemeral = interaction.options.getBoolean('hidden')

    let embeds = []
    const trinket = await Trinkets.getTrinkets(id, interaction.guild.id)
    if (trinket) {
        if (ephemeral && trinket.creatorId === interaction.user.id) { 
            embeds.push(await display(trinket, interaction, config, false)) //If owner calls hidden view
        } else {
            embeds.push(await display(trinket, interaction, config, trinket.hidden))
        }

        if (trinket.ownerId.startsWith('gacha')) {
            const reward = await forgeReward(trinket, interaction, false)
            if (reward > 0) {
                embeds.push(
                    new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setTitle(`Current Return on Roll: \`${reward} PP\``)
                )
            }
        }
        
    } else {
        embeds = [new EmbedBuilder().setTitle(`:x: Trinket \`ID ${id}\` doesn't exist :x:`)]
        ephemeral = true
    }
    return {embeds: embeds, ephemeral: ephemeral}
}

async function display(trinket, interaction, config, hidden = false) {
    await interaction.guild.members.fetch() // Load guild members into cache
    const rarity = config[`rarityNameT${trinket.tier}`]
    const owner = trinket.ownerId.includes('gacha') ? '*The Gacha*' : interaction.client.users.cache.get(trinket.ownerId) ?? 'Unknown'
    const creator = interaction.client.users.cache.get(trinket.creatorId) ?? 'Unknown'
    const createdAt = `<t:${Date.parse(trinket.createdAt) / 1000}:f>`
    const updatedAt = `<t:${Date.parse(trinket.updatedAt) / 1000}:f>`

    if (hidden) {
        const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`${rarity} :question: \`???\``)
        .setDescription(`ID: \`${trinket.trinketId}\`\nCreated By: ${creator} on ${createdAt}\n\nsecret :)`)
        return embed
    }

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`${rarity} ${trinket.emoji} \`${trinket.name}\``)
        .setDescription(`ID: \`${trinket.trinketId}\`\nOwned By: ${owner} since ${updatedAt}\nCreated By: ${creator} on ${createdAt}\n\n${trinket.description ?? ''}`)
        .setImage(trinket.image)

    return embed
}