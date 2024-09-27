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
            const tradeReply = await handleTradeResponse(reply, interaction)
            if (tradeReply && tradeReply.components.length > 0) {
                await handleTrade(tradeReply, interaction)
            }
        }
    },
}

//Create a new trade request
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

//Handle trade accepting/declining, and set up trade window on accept
async function handleTradeResponse(reply, interaction) {
    const target = interaction.options.getUser('user')
    const user = interaction.user
    const config = await Config.getConfig(interaction.guild.id)
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
    const components = []

    try {
        var button = await reply.awaitMessageComponent({ time: 300_000 })
    } catch (e) {
        //If trade times out
        embed.setTitle(`Trade request to ${target.displayName} timed out after 5 minutes :(`)
        interaction.editReply({embeds: [embed], components: [], content: ''})
        return null
    }
    //If trade is accepted, create trade window and add trade to guild's active trade array. Only target can accept
    if (button.user.id === target.id && button.customId === 'tradeAccept') {
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
        const buttons = new ActionRowBuilder()
            .setComponents(
                new ButtonBuilder()
                    .setCustomId(`ready${user.id}`)
                    .setLabel(`${user.displayName}`)
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`ready${target.id}`)
                    .setLabel(`${target.displayName}`)
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('readyCancel')
                    .setLabel(`Cancel Trade`)
                    .setStyle(ButtonStyle.Danger),
            )
        components.push(buttons)
        const guildTrades = interaction.client.trades.get(interaction.guild.id)
        guildTrades.push(new Trade(reply, user.id, target.id, interaction.guild.id))
    }
    //If trade is declined, return decline message and done. Both sender and target can cancel
    else if ((button.user.id === target.id || button.user.id === user.id) && button.customId === 'tradeDecline') {
        if (button.user.id === target.id) {
            embed.setTitle(':x: Trade declined! :x:')
        } else {
            embed.setTitle(':x: Trade canceled! :x:')
        }
    } 
    else {
        if (button.user.id === user.id) {
            button.reply({embeds: [embed.setTitle(`You can't accept your own trade!`)], ephemeral: true})
        } else {
            button.reply({embeds: [embed.setTitle(`yo hands off :rage:`)], ephemeral: true})
        }
        
        return await handleTradeResponse(reply, interaction)
    }
    button.deferUpdate()
    return interaction.editReply({embeds: [embed], components: components, content: ''})    
}

//Add items to an existing trade
async function add(interaction) {
    const user = interaction.user
    const points = interaction.options.getInteger('points')
    const itemString = interaction.options.getString('items') ?? ''
    const items = itemString.replace(/\s/g, '').split(',')
    const trade = await interaction.client.trades.get(interaction.guild.id).find((t) => t.userId1 === user.id || t.userId2 === user.id)
    const config = await Config.getConfig(interaction.guild.id)

    if (!trade) {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`You have no trades active! Create one with \`/trade create\``)
        return {embeds: [embed], ephemeral: true}
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
            errors += `You don't have enough points to offer \`${points} PP\`\n`
        } else if (points < 0) {
            errors += `You cannot offer negative points\n`
        } else {
            //If point value is valid
            trade[`points${whichUser}`] += points
        }
    }

    //Edit trade window
    const message = await trade.reply.fetch()
    const tradeEmbed = message.embeds[0]
    const tradeComponents = message.components[0]
    let content = '`'
    for (const field of tradeEmbed.fields) { //Each side of the trade is stored in an embed field, iterate to find the user's side then break
        if (field.name === user.displayName) {
            
            //Points
            if (trade[`points${whichUser}`] > 0) {
                content += `${trade[`points${whichUser}`]} Placeholder Points, `
            }
            //Trinkets
            for (const trinket of trade[`items${whichUser}`]) {
                content += `${config[`rarityNameT${trinket.tier}`]} ${trinket.name} (ID ${trinket.id}), `
            }

            content = content.slice(0, -2)
            content += '`'
            field.value = content

            //TODO implement this some time, this solution doesn't work properly and I need to add other things :(
            //If trade contents change, unready both users
            // for (let c in tradeComponents.components) {
            //     const component = tradeComponents.components[c]
            //     if (component.customId.startsWith('ready') && component.style === ButtonStyle.Primary) { //Find ready buttons
            //         const newButton = new ButtonBuilder()
            //             .setLabel(component.label)
            //             .setCustomId(component.customId)
            //             .setStyle(ButtonStyle.Secondary)
            //         tradeComponents.components[c] = newButton
            //     }
            //     else if (component.customId === 'readyComplete') {
            //         tradeComponents.components.splice(0, 1)
            //     }
            // }
            // trade.ready1 = false
            // trade.ready2 = false
            // trade.completeButton = false
            break
        }
    }
    
    await trade.reply.edit({embeds: [tradeEmbed], components: [tradeComponents]})

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setDescription(`${errors}Successfully added ${content} to trade`)

    return {embeds: [embed], ephemeral: true}
}

//Handle everything regarding the trade window itself. User confirmation buttons, canceling, and confirming the trade
async function handleTrade(reply, interaction) {
    const target = interaction.options.getUser('user')
    const user = interaction.user
    const config = await Config.getConfig(interaction.guild.id)
    const trades = interaction.client.trades.get(interaction.guild.id)
    const trade = trades.find((t) => t.userId1 === user.id || t.userId2 === user.id)

    let tradeComplete = false

    while (tradeComplete === false) {
        //First, check ready status and determine whether to display trade completion button
        if (trade.ready1 && trade.ready2) {
            trade.completeButton = true
            const completeButton = new ButtonBuilder()
                .setCustomId('readyComplete')
                .setLabel('Complete Trade')
                .setStyle(ButtonStyle.Success)
            const components = reply.components[0]
            components.components.unshift(completeButton)
            reply = await reply.edit({components: [components]})
        } 
        else if (trade.completeButton) {
            trade.completeButton = false
            const components = reply.components[0]
            components.components.splice(0, 1)
            reply = await reply.edit({components: [components]})
        }

        //Await button response, trades time out after 15 minutes
        try {
            var button = await reply.awaitMessageComponent({ time: 900_000 })
        } catch (e) {
            embed.setTitle(`Trade between ${user.displayName} and ${target.displayName} timed out after 15 minutes :(`)
            interaction.editReply({embeds: [embed], components: [], content: ''})
            return null
        }

        //If either involved user presses their own button
        if ((button.user.id === user.id && button.customId === `ready${user.id}`) || (button.user.id === target.id && button.customId === `ready${target.id}`))  {
            const components = reply.components
            const customId = button.user.id === user.id ? `ready${user.id}` : `ready${target.id}`
            for (let c in components[0].components) {
                const component = components[0].components[c]
                if (component.customId === customId) { //Find the matching ready button
                    const ready = (component.style === ButtonStyle.Secondary)
                    customId === `ready${user.id}` ? trade.ready1 = ready : trade.ready2 = ready

                    const newComponent = new ButtonBuilder()
                        .setLabel(component.label)
                        .setCustomId(component.customId)
                        .setStyle(component.style === ButtonStyle.Secondary ? ButtonStyle.Primary : ButtonStyle.Secondary) //Style is used for both state and visuals
                    components[0].components[c] = newComponent
                    reply = await reply.edit({components: [components[0]]})
                    button.deferUpdate()
                    break
                }
            }
        } 
        else if ((button.user.id === user.id && button.customId === `ready${target.id}`) || (button.user.id === target.id && button.customId === `ready${user.id}`)) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('That\'s not your confirmation button :rage:')
            button.reply({embeds: [embed], ephemeral: true})
        }
        //If either involved user cancels
        else if ((button.user.id === target.id || button.user.id === user.id) && button.customId === `readyCancel`) {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(':x: Trade canceled! :x:')

            await reply.edit({embeds: [embed], components: []})
            tradeComplete = true
        } 
        //Once both users are ready and someone hits the complete button, handle trade
        else if ((button.user.id === target.id || button.user.id === user.id) && button.customId === `readyComplete`) {
            //Target recieves User's points
            await Users.updateBalance(trade.userId1, interaction.guild.id, -1*trade.points1) 
            await Users.updateBalance(trade.userId2, interaction.guild.id, trade.points1)

            //User recieves Target's points
            await Users.updateBalance(trade.userId2, interaction.guild.id, -1*trade.points2) 
            await Users.updateBalance(trade.userId1, interaction.guild.id, trade.points2)

            //Target recieves User's trinkets
            for (const trinket of trade.items1) {   
                trinket.ownerId = trade.userId2
                await trinket.save()
            }
            //User recieves Target's trinkets
            for (const trinket of trade.items2) {   
                trinket.ownerId = trade.userId1
                await trinket.save()
            }

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(':white_check_mark: Trade successful! :white_check_mark:')
            await reply.edit({embeds: [embed], components: []})
            tradeComplete = true
        }
        else {
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('yo hands off :rage:')
            button.reply({embeds: [embed], ephemeral: true})
        }
    }
    //Remove the trade from the client's trades collection
    const index = trades.indexOf(trade)
    trades.splice(index, 1)
    interaction.client.trades.set(interaction.guild.id, trades)
}