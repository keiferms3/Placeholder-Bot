import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config, Trade, Trinkets, Users } from "../../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('trade')
        .setDescription('Not yet implemented!!')
        .addSubcommand(create => (
            create
            .setName('create')
            .setDescription('Create a new trade')
            .addUserOption(user => (
                user
                .setName('user')
                .setDescription('The user to trade with')
                .setRequired(true)
            ))
        ))
        .addSubcommand(add => (
            add
            .setName('add')
            .setDescription('Add items/points to an existing trade')
            .addStringOption(items => (
                items
                .setName('items')
                .setDescription('List item IDs separated by commas to add to the trade (e.g. "5, 6, 11" or "5,6,11")')
            ))
            .addIntegerOption(points => (
                points
                .setName('points')
                .setDescription('Amount of Placeholder Points to trade')
            ))
        )),
    async execute(interaction) {
        const command = interaction.options.getSubcommand()
        if (command === 'create') {
            var response = await create(interaction)
        } 
        else if (command === 'add') {
            var response = await add(interaction)
        } 
        else {
            return await interaction.reply(`Trade command \`${command}\` not found`)
        }

        const reply = await interaction.reply(response)

        //Listening for trade accept/decline
        if (command === 'create' && response.ephemeral !== true) {
            await handleTradeResponse(reply, interaction)
        }
    },
}

async function create(interaction) {
    const target = interaction.options.getUser('user')
    const trade = await interaction.client.trades.get(interaction.guild.id).find((t) => t.userId1 === interaction.user.id || t.userId2 === interaction.user.id)
    if (trade) {
        return {content: `One or both users are already in an active trade, try again later`, ephemeral: true}
    }

    const config = await Config.getConfig(interaction.guild.id) 
    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('tradeAccept')
                .setLabel('Accept')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('tradeDecline')
                .setLabel('Decline')
                .setStyle(ButtonStyle.Danger)
        )
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`${interaction.user.displayName} wants to trade with ${target.displayName}`)
        .setDescription(`<@${target.id}> do you accept?`)

    return {content: `<@${target.id}>`, embeds: [embed], components: [buttons]}
}

async function handleTradeResponse(reply, interaction) {
    const target = interaction.options.getUser('user')
    const user = interaction.user
    const config = await Config.getConfig(interaction.guild.id)
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
    const components = []

    try {
        const collectorFilter = i => i.user.id === target.id
        const button = await reply.awaitMessageComponent({ filter: collectorFilter, time: 300_000 })

        //If trade is accepted, create trade window and add trade to guild's active trade array
        if (button.customId === 'tradeAccept') {
            embed.setTitle('Trade...')
                 .setDescription(`Use \`/trade add\` to add items and points`)
                 .addFields({
                name: `${user.displayName}`,
                value: `\` \``,
                inline: true,
            }, {
                name: `${target.displayName}`,
                value: `\` \``,
                inline: true,
            })
            const guildTrades = interaction.client.trades.get(interaction.guild.id)
            guildTrades.push(new Trade(reply, user.id, target.id, interaction.guild.id))
        }
        //If trade is declined, return decline message and done
        else if (button.customId === 'tradeDecline') {
            embed.setTitle('Trade declined!')
        }
        //wuh??
        else {
            embed.setTitle('wuh??')
        }
        interaction.editReply({embeds: [embed], components: components, content: ''})

    } catch (e) {
        //If trade times out (or if another error happens but we just hope that doesn't happen)
        console.error(e)
        embed.setTitle(`Trade request to <@${target.id}> timed out after 5 minutes :(`)
        interaction.editReply({embeds: [embed], components: [], content: ''})
    }
}

async function add(interaction) {
    const user = interaction.user
    const points = interaction.options.getInteger('points')
    const itemString = interaction.options.getString('items') ?? ''
    const items = itemString.replace(/\s/g, '').split(',')
    const trade = await interaction.client.trades.get(interaction.guild.id).find((t) => t.userId1 === user.id || t.userId2 === user.id)

    if (!trade) {
        return `You have no trades active! Create one with \`/trade create\``
    }
    const whichUser = user.id === trade.userId1 ? 1 : 2

    let errors = ''
    //Trinkets
    for (const item of items) {
        if (!item) { continue }
        const trinket = await Trinkets.getTrinkets(item)

        if (!trinket) {
            errors += `Trinket \`#${item}\` doesn't exist!\n`
            continue
        } else if (trinket.ownerId !== user.id) {
            errors += `You don't own trinket \`#${trinket.id}\`\n`
            continue
        }
        //If valid item is added
        trade[`items${whichUser}`].push(trinket)
    }

    //Points
    if (points) {
        const balance = await Users.getBalance(user.id, interaction.guild.id)
        if (points > balance) {
            errors += `You don't have enough points to offer \`${points} PP\``
        } else if (points < 0) {
            errors += `You cannot offer negative points`
        } else {
            //If point value is valid
            trade[`points${whichUser}`] = points //TODO Make this actually *add* later, += wasn't working fsr
        }
    }

    //Edit trade window
    const message = await trade.reply.fetch()
    const embed = message.embeds[0]
    for (const field of embed.fields) {
        if (field.name === user.displayName) {
            let content = '`'
            //Points
            if (trade[`points${whichUser}`] > 0) {
                content += `${trade[`points${whichUser}`]} Placeholder Points, `
            }
            //Trinkets
            for (const trinket of trade[`items${whichUser}`]) {
                content += `${trinket.name} (ID ${trinket.id}), `
            }
            content = content.slice(0, -2)
            content += '`'
            field.value = content
            break
        }
    }
    trade.reply.edit({embeds: [embed]})

    if (errors) {
        return {content: errors, ephemeral: true}
    }
    return {content: `Successfully added to trade`, ephemeral: true}
}