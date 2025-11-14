import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"
import { setTimeout } from 'timers/promises'
import { forgeReward } from "../trinkets/trinket-gacha.js"

export default {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Tests a basic command!')
        .addStringOption((string) => (
            string
            .setName('type')
            .setDescription('Select which leaderboard you wish to view')
            .setRequired(true)
            .addChoices([
                {name: 'Points', value: 'points'}, 
                {name: 'Wealth', value: 'wealth'}, 
                {name: 'Trinkets Created (Quantity)', value: 'trinketCount'}, 
                {name: 'Trinkets Created (Value)', value: 'trinketValue'},
                {name: 'Trinkets Owned (Quantity)', value: 'trinketOwnedCount'},
                {name: 'Trinkets Owned (Value)', value: 'trinketOwnedValue'},])
        ))
        .addBooleanOption((visible) => (
            visible
            .setName('hidden'))
            .setDescription('If true, command\'s output will not be visible to others')),
    async execute(interaction) {
        const command = interaction.options.getString('type')
        if (command === 'points') {
            await points(interaction)
        } else if (command === 'wealth') {
            await wealth(interaction)
        } else if (command === 'trinketCount') {
            await trinketsCount(interaction)
        } else if (command === 'trinketValue') {
            await trinketsValue(interaction)
        } else if (command === 'trinketOwnedCount') {
            await trinketsOwnedCount(interaction)
        } else if (command === 'trinketOwnedValue') {
            await trinketsOwnedValue(interaction)
        }
    },
}

async function points(interaction) {
    const users = await Users.getUser(null, interaction.guild.id)
    users.sort((a, b) => (b.points - a.points))

    await handleLeaderboard(`:coin: Placeholder Point Leaderboard :coin:`, users, interaction, (users, i) => {
        const user = interaction.client.users.cache.get(users[i].userId) ?? {displayName: 'Unknown'}
        return `**${i+1}.** \`${user.displayName}\` | \`${users[i].points} PP\`\n`
    })
}

async function wealth(interaction) {
    const config = await Config.getConfig(interaction.guild.id)

    const wealthMap = new Collection()
    const users = await Users.getUser(null, interaction.guild.id)
    //Calculate wealth by summing points, owned trinket values, and gacha trinkets awaiting forge reward
    for (const user of users) {
        let wealth = 0
        const trinketsOwned = await Trinkets.getTrinkets(undefined, interaction.guild.id, user.userId)
        for (const trinket of trinketsOwned) {
            wealth += config[`trinketCostT${trinket.tier}`]
        }
        const trinketsCreated = await Trinkets.getTrinkets(undefined, interaction.guild.id, undefined, user.userId)
        for (const trinket of trinketsCreated) {
            if (trinket.ownerId.startsWith('gacha') && trinket.returned === false) {
                wealth += await forgeReward(trinket, interaction, false)
            }
        }
        wealthMap.set(user.userId, wealth + user.points)
    }
    const usersByWealth = [...wealthMap.entries()].sort((a, b) => (b[1] - a[1]))

    //Render pages and handle buttons
    await handleLeaderboard(`:moneybag: Total Wealth Leaderboard :moneybag:`, usersByWealth, interaction, (array, i) => {
        const user = interaction.client.users.cache.get(array[i][0]) ?? {displayName: 'Unknown'}
        return `**${i+1}.** \`${user.displayName}\` | \`${array[i][1]} Total PP\`\n`
    })

}

async function trinketsCount(interaction) {
    const users = await Users.getUser(null, interaction.guild.id)

    const trinketMap = new Collection()
    for (const user of users) {
        const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id, undefined, user.userId)
        const tally = [trinkets.length, 0, 0, 0]
        for (const trinket of trinkets) { tally[trinket.tier]++ }
        trinketMap.set(user.userId, tally)
    }
    const usersByTrinkets = [...trinketMap.entries()].sort((a, b) => (b[1][0] - a[1][0]))
    
    await handleLeaderboard(`:hammer_pick: Trinkets Created (Quantity) Leaderboard :hammer_pick:`, usersByTrinkets, interaction, (array, i) => {
        const user = interaction.client.users.cache.get(array[i][0]) ?? {displayName: 'Unknown'}
        return `**${i+1}.** \`${user.displayName}\` | \`${array[i][1][0]} Total Trinkets\` \`(${array[i][1][1]}/${array[i][1][2]}/${array[i][1][3]})\`\n`
    })
}

async function trinketsValue(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    
    const users = await Users.getUser(null, interaction.guild.id)
    const trinketMap = new Collection()
    for (const user of users) {
        const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id, undefined, user.userId)
        const tally = [0, 0, 0, 0]
        for (const trinket of trinkets) { tally[trinket.tier] += config[`trinketCostT${trinket.tier}`]}
        tally[0] = tally[1] + tally[2] + tally[3]
        trinketMap.set(user.userId, tally)
    }
    const usersByTrinkets = [...trinketMap.entries()].sort((a, b) => (b[1][0] - a[1][0]))
    
    await handleLeaderboard(`:tools: Trinkets Created (Value) Leaderboard :tools:`, usersByTrinkets, interaction, (array, i) => {
        const user = interaction.client.users.cache.get(array[i][0]) ?? {displayName: 'Unknown'}
        return `**${i+1}.** \`${user.displayName}\` | \`${array[i][1][0]} Trinket Value\` \`(${array[i][1][1]}/${array[i][1][2]}/${array[i][1][3]})\`\n`
    })
}

async function trinketsOwnedCount(interaction) {
    const users = await Users.getUser(null, interaction.guild.id)

    const trinketMap = new Collection()
    for (const user of users) {
        const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id, user.userId)
        const tally = [trinkets.length, 0, 0, 0]
        for (const trinket of trinkets) { tally[trinket.tier]++ }
        trinketMap.set(user.userId, tally)
    }
    const usersByTrinkets = [...trinketMap.entries()].sort((a, b) => (b[1][0] - a[1][0]))
    
    await handleLeaderboard(`:package: Trinkets Owned (Quantity) Leaderboard :package:`, usersByTrinkets, interaction, (array, i) => {
        const user = interaction.client.users.cache.get(array[i][0]) ?? {displayName: 'Unknown'}
        return `**${i+1}.** \`${user.displayName}\` | \`${array[i][1][0]} Total Trinkets\` \`(${array[i][1][1]}/${array[i][1][2]}/${array[i][1][3]})\`\n`
    })
}

async function trinketsOwnedValue(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const users = await Users.getUser(null, interaction.guild.id)

    const trinketMap = new Collection()
    for (const user of users) {
        const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id, user.userId)
        const tally = [0, 0, 0, 0]
        for (const trinket of trinkets) { tally[trinket.tier] += config[`trinketCostT${trinket.tier}`]}
        tally[0] = tally[1] + tally[2] + tally[3]
        trinketMap.set(user.userId, tally)
    }
    const usersByTrinkets = [...trinketMap.entries()].sort((a, b) => (b[1][0] - a[1][0]))
    
    await handleLeaderboard(`:package: Trinkets Owned (Value) Leaderboard :package:`, usersByTrinkets, interaction, (array, i) => {
        const user = interaction.client.users.cache.get(array[i][0]) ?? {displayName: 'Unknown'}
        return `**${i+1}.** \`${user.displayName}\` | \`${array[i][1][0]} Trinket Value\` \`(${array[i][1][1]}/${array[i][1][2]}/${array[i][1][3]})\`\n`
    })
}

async function handleLeaderboard(title, array, interaction, lineFunction) {
    const DISPLAY_NUM = 10

    const config = await Config.getConfig(interaction.guild.id)
    const ephemeral = interaction.options.getBoolean('hidden')

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(title)
    const components = new ActionRowBuilder()
        .setComponents(
            new ButtonBuilder()
                .setCustomId('leaderboardBack')
                .setLabel('◀ Previous Page')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('leaderboardForward')
                .setLabel('Next Page ▶')
                .setStyle(ButtonStyle.Secondary),
        )

    const maxPages = Math.ceil(array.length / DISPLAY_NUM)
    let firstPage = true
    let pageNum = 1
    const timeout = setTimeout(600_000, 'timeout')
    
    while (true) {
        //Render page
        let desc = ''
        for (let i = (pageNum-1)*DISPLAY_NUM; i < pageNum*DISPLAY_NUM; i++) {
            if (!array[i]) { continue } //If page has less than 10 members lol
            desc += lineFunction(array, i)
        }
        embed.setDescription(desc)
             .setFooter({text: `Page ${pageNum} / ${maxPages}`})
        
        //Reply if first page, otherwise edit
        if (firstPage) { 
            var reply = await interaction.reply({embeds: [embed], components: [components], ephemeral: ephemeral})
            firstPage = false 
        }
        else { await reply.edit({embeds: [embed]}) }

        //Await buttons or timeout
        const awaitButton = reply.awaitMessageComponent()
        const button = await Promise.any([awaitButton, timeout])

        //Check if timeout triggered
        if (button === 'timeout') {
            reply.edit({embeds: [embed], components: []})
            return
        }

        //If button recieved, determine which button was pressed
        if (button.customId === 'leaderboardForward') {
            (pageNum < maxPages) ? pageNum += 1 : pageNum = 1
        } else if (button.customId === 'leaderboardBack') {
            (pageNum > 1) ? pageNum -= 1 : pageNum = maxPages
        } else {
            reply.edit({embeds: [], content: 'Error: Invalid button ID recieved'})
            return
        }
        button.deferUpdate()
    }
}