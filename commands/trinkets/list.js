import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js"
import { Config, Trinkets } from "../../database/objects.js"
import { clamp } from "../../helpers.js"
import { setTimeout } from 'timers/promises'

export async function list(interaction) {
    await interaction.guild.members.fetch() // Load guild members into cache
    let pageNum = interaction.options.getInteger('page') ?? 1
    const createdBy = interaction.options.getUser('createdby')
    const ownedBy = interaction.options.getUser('ownedby')
    const tier = interaction.options.getInteger('rarity')
    const config = await Config.getConfig(interaction.guild.id)
    let ephemeral = interaction.options.getBoolean('hidden') ?? false

    let trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id, ownedBy?.id ?? undefined, createdBy?.id ?? undefined) //Handles filtering by creator and owner
    const pageLen = 25
    const pages = []

    //If tier is specified filter by tier
    if (tier) {
        trinkets = trinkets.filter(t => t.tier === tier)
    }

    //Divide full trinket list into page sized subarrays
    for (let i = 0; i < trinkets.length; i += pageLen) {
        const page = trinkets.slice(i, i + pageLen)
        pages.push(page)
    }

    //Starting page validation
    pageNum = clamp(pageNum, 1, pages.length)

    //Filtered string creation
    let title = `:card_box: Trinket List :card_box:`
    if (createdBy || ownedBy || tier) {
        title += `\n`
        if (createdBy) {
            title += `Created by \`${createdBy.displayName}\`\n`
        }
        if (ownedBy) {
            title += `Owned by \`${ownedBy.displayName}\`\n`
        }
        if (tier) {
            title += `Rarity \`${config[`rarityNameT${tier}`]}\`\n`
        }
    }

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(title)
        .setFooter({text: `Page ${pageNum} / ${pages.length}`})
    const components = new ActionRowBuilder()
        .setComponents(
            new ButtonBuilder()
                .setCustomId('listBack')
                .setLabel('◀ Previous Page')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('listForward')
                .setLabel('Next Page ▶')
                .setStyle(ButtonStyle.Secondary)
        )

    //Render the first page
    if (pages.length > 0) {
        let content = ''
        for (const trinket of pages[pageNum - 1]) {
            const owner = interaction.client.users.cache.get(trinket.ownerId)
            const styling = (trinket.tier > 1) ? (trinket.tier > 2) ? '***' : '**' : '' //Nothing for 1, bold for 2, bold italics for 3
            
            if (trinket.hidden) {content += `**\`${trinket.trinketId}.\`** :question:${styling}\`???\`${styling}\n`; continue} //Don't display hidden trinkets
            content += `**\`${trinket.trinketId}.\`** ${trinket.emoji}${styling}\`${trinket.name}\`${styling} ${trinket.ownerId.startsWith('gacha') ? `` : `| \`${owner.globalName ?? 'Unknown'}\``}\n`
        }
        embed.setDescription(content)
        
    } else {
        embed.setDescription('No trinkets found')
        await interaction.reply({embeds: [embed], ephemeral: ephemeral})
        return
    }
    const reply = await interaction.reply({embeds: [embed], components: [components], ephemeral: ephemeral})

    const timeout = setTimeout(600_000, 'timeout')
    while (true) { //Bad practice? maybe... but it terminates after 10 minutes so whatevahhh there's a base case
        const awaitButton = reply.awaitMessageComponent()
        const button = await Promise.any([awaitButton, timeout])
        
        if (button === 'timeout') {
            reply.edit({embeds: [embed], components: []})
            return
        }

        //Update active page
        if (button.customId === 'listForward') {
            (pageNum < pages.length) ? pageNum += 1 : pageNum = 1
        } else if (button.customId === 'listBack') {
            (pageNum > 1) ? pageNum -= 1 : pageNum = pages.length
        } else {
            reply.edit({embeds: [], content: 'this dont work what'})
            return
        }

        //Update page content
        let content = ''
        for (const trinket of pages[pageNum - 1]) {
            const owner = interaction.client.users.cache.get(trinket.ownerId)
            const styling = (trinket.tier > 1) ? (trinket.tier > 2) ? '***' : '**' : '' //Nothing for 1, bold for 2, bold italics for 3

            if (trinket.hidden) {content += `**\`${trinket.trinketId}.\`** :question:${styling}\`???\`${styling}\n`; continue} //Don't display hidden trinkets
            content += `**\`${trinket.trinketId}.\`** ${trinket.emoji}${styling}\`${trinket.name}\`${styling} ${trinket.ownerId.startsWith('gacha') ? `` : `| \`${owner.globalName ?? 'Unknown'}\``}\n`
        }
        embed.setDescription(content)
             .setFooter({text: `Page ${pageNum} / ${pages.length}`})

        reply.edit({embeds: [embed]})
        button.deferUpdate()
    }
}