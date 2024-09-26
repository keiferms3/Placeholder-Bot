import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config } from "../../database/objects.js"

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
        if (command === 'create') {
            const accept = await handleTradeResponse(reply, interaction)
        }
    },
}

async function create(interaction) {
    const target = interaction.options.getUser('user')
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
    const config = await Config.getConfig(interaction.guild.id)
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
    const components = []

    try {
        const collectorFilter = i => i.user.id === target.id
        const button = await reply.awaitMessageComponent({ filter: collectorFilter, time: 300_000 })

        if (button.customId === 'tradeAccept') {
            embed.setTitle('Trade...')
            embed.addFields({
                name: `${interaction.user.displayName}`,
                value: `\` \`\nUse \`/trade add\` to add items and points`,
                inline: true,
            }, {
                name: `${target.displayName}`,
                value: `\` \`\nUse \`/trade add\` to add items and points`,
                inline: true,
            })

        }
        else if (button.customId === 'tradeDecline') {
            embed.setTitle('Trade declined!')

        }
        else {
            embed.setTitle('wuh??')
        }
        interaction.editReply({embeds: [embed], components: components, content: ''})

    } catch (e) {
        embed.setTitle(`Trade request to <@${target.id}> timed out after 5 minutes :(`)
        interaction.editReply({embeds: [embed], components: [], content: ''})
    }
}

async function add(interaction) {
    const items = interaction.options.getString('items').replace(/\s/g, '').split(',')
    const points = interaction.options.getInteger('points')

    return `${items}`
}