import { EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"
import emojiRegex from "emoji-regex-xs"
import { UpdateGachaChance } from "../../helpers.js"
import { displayGacha } from "./trinket-gacha.js"

export default {
    data: new SlashCommandBuilder()
        .setName('trinket')
        .setDescription('Tests a basic command!')
        //Trinket view command
        .addSubcommand((view) => (
            view
            .setName('view')
            .setDescription('View a specific trinket by ID')
            .addIntegerOption((int) => (
                int
                .setName('id')
                .setDescription('Trinket\'s unique ID number')
                .setRequired(true)
            ))
            .addBooleanOption((visible) => (
                visible
                .setName('hidden'))
                .setDescription('If true, command\'s output will not be visible to others. Allows viewing your own hidden trinkets'))
        ))
        //Trinket search by name command
        .addSubcommand((search) => (
            search
            .setName('search')
            .setDescription('View a specific trinket by name')
            .addStringOption((name) => (
                name
                .setName('name')
                .setDescription('Trinket\'s non-unique name')
                .setRequired(true)
                .setAutocomplete(true)
            ))
            .addBooleanOption((visible) => (
                visible
                .setName('hidden'))
                .setDescription('If true, command\'s output will not be visible to others'))
        ))
        //Trinket gacha roll command
        .addSubcommand((roll) => (
            roll
            .setName('roll')
            .setDescription('Roll for trinkets!')
            .addBooleanOption((visible) => (
                visible
                .setName('hidden'))
                .setDescription('If true, command\'s output will not be visible to others'))
        ))
        //Trinket creation command
        .addSubcommand((create) => (
            create
            .setName('create')
            .setDescription('Create a new trinket! Costs Placeholder Points to use, type /shop to view this server\'s prices!')
            .addIntegerOption((int) => (
                int
                .setName('rarity')
                .setDescription('The trinket\'s rarity, affects cost. Command choice names are not affected by config.')
                .setRequired(true)
                .addChoices([{name: 'Common', value: 1}, {name: 'Rare', value: 2}, {name: 'Legendary', value: 3}])
            ))
            .addStringOption((string) => (
                string
                .setName('name')
                .setDescription('The trinket\'s name, 64 character limit')
                .setRequired(true)
                .setMaxLength(64)
            ))
            .addStringOption((string) => (
                string
                .setName('emoji')
                .setDescription('The trinket\'s emoji icon, must be from this server and non-animated')
                .setRequired(true)
                .setMaxLength(64)
            ))
            .addStringOption((string) => (
                string
                .setName('image')
                .setDescription('URL of the trinket\'s image, 512 character limit')
                .setRequired(false)
                .setMaxLength(512)
            ))
            .addStringOption((string) => (
                string
                .setName('description')
                .setDescription('The trinket\'s item description, 1200 character limit')
                .setRequired(false)
                .setMaxLength(1200)
            ))
            .addBooleanOption((visible) => (
                visible
                .setName('hidden'))
                .setDescription('If true, command\'s output will not be visible to others'))
        )),
    async execute(interaction) {
        try {
            const response = await trinket(interaction)
            await interaction.reply(response)
        } catch (e) {
            console.error(e)
        }
    },
}

async function trinket(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    
    const command = interaction.options.getSubcommand()
    if (command === 'create') {
        var response = await create(interaction, config)
    } 
    else if (command === 'roll') {
        var response = await displayGacha(interaction)
    } 
    else if (command === 'view') {
        var response = await view(interaction, config)
    } 
    else if (command === 'search') {
        var response = await search(interaction, config)
    } 
    else {
        return `Tinket command "\`${command}\`" not found`
    }

    return response
}

async function create(interaction, config) {
    const guildId = interaction.guild.id
    const tier = interaction.options.getInteger('rarity')
    const name = interaction.options.getString('name')
    const emojiString = interaction.options.getString('emoji')
    const image = interaction.options.getString('image')
    const lore = interaction.options.getString('description')
    const ephemeral = interaction.options.getBoolean('hidden')
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`:x: Failed to create trinket :x:`)
    
    //Validation
    if (!(emojiString.match(emojiRegex()) || emoji.match(/<:.+?:\d+>$/))) { //This custom emote regex is a shitty solution, it doesn't stop emotes from other servers and matches with invalid emotes (eg <:slurslurslurs:1>)
        return embed.setDescription(`Invalid emoji`)                  //There is a way to check if the bot can use the emote but, I'm too lazy and this is a private bot. Fuck you whoever inevitably makes me fix this :(   
    } else if (!(image === null || checkImageUrl(image))) {
        return embed.setDescription(`Invalid image URL. Make sure you are directly linking the image`)
    } //Character length limits
    else if (name.length > 64) { //Felt right
        return embed.setDescription(`Name has a character limit of 64. Your name was ${name.length} characters long`)
    } else if (emojiString.length > 64) { //Custom emojis should never be longer than 56 characters and this felt right
        return embed.setDescription(`Emoji has a character limit of 64. Your "emoji" was ${emojiString.length} characters long`)
    } else if (lore && lore.length > 1200) { //Due to 2000 char message limit
        return embed.setDescription(`Description has a character limit of 1200. Your description was ${lore.length} characters long`)
    } else if (image && image.length > 512) { //1840 characters max user input, so we should never hit the 2000 limit if this info ever gets sent as a raw message
        return embed.setDescription(`Image URL has a character limit of 512. Your URL was ${image.length} characters long`)
    }
    const emoji = emojiString.match(emojiRegex())[0]

    //Check balances, deduct points, and create trinket
    const user = await Users.getUser(interaction.user.id, guildId)
    if (tier === 1) {
        if (user.points < config.trinketT1Cost) {
            embed.setDescription(`${config.rarityNameT1} trinkets require \`${config.trinketT1Cost} PP\`, you have \`${user.points} PP\``)
            return {embeds: [embed]}
        }
        await Users.updateBalance(user.userId, user.guildId, -1*config.trinketT1Cost)
    }
    else if (tier === 2) {
        if (user.points < config.trinketT2Cost) {
            embed.setDescription(`${config.rarityNameT2} trinkets require \`${config.trinketT2Cost} PP\`, you have \`${user.points} PP\``)
            return {embeds: [embed]}
        }
        await Users.updateBalance(user.userId, user.guildId, -1*config.trinketT2Cost)
    }
    else if (tier === 3) {
        if (user.points < config.trinketT3Cost) {
            embed.setDescription(`${config.rarityNameT3} trinkets require \`${config.trinketT3Cost} PP\`, you have \`${user.points} PP\``)
            return {embeds: [embed]}
        }
        await Users.updateBalance(user.userId, user.guildId, -1*config.trinketT3Cost)
    }

    await Trinkets.addTrinket(tier, name, emoji, image, lore, user.userId, guildId, ephemeral, interaction)
    UpdateGachaChance(tier, interaction)

    embed.setTitle(`${config[`rarityNameT${tier}`]} trinket ${emoji}\`${name}\` successfully created!`)
         .setDescription(lore)
         .setImage(image)
    return {embeds: [embed], ephemeral: ephemeral}
}

async function view(interaction, config) {
    const id = interaction.options.getInteger('id')
    const ephemeral = interaction.options.getBoolean('hidden')

    let embed
    const trinket = await Trinkets.getTrinkets(id)
    if (trinket) {
        if (ephemeral && trinket.creatorId === interaction.user.id) { 
            embed = await display(trinket, interaction, config, false) //If owner calls hidden view
        } else {
            embed = await display(trinket, interaction, config, trinket.hidden)
        }
        
    } else {
        embed = new EmbedBuilder().setTitle('oops')
    }
    return {embeds: [embed], ephemeral: ephemeral}
}

async function search(interaction, config) {
    
}

async function display(trinket, interaction, config, hidden = false) {
    await interaction.guild.members.fetch() // Load guild members into cache
    const rarity = config[`rarityNameT${trinket.tier}`]
    const owner = trinket.ownerId.includes('gacha') ? '*The Gacha*' : interaction.client.users.cache.get(trinket.ownerId)
    const creator = interaction.client.users.cache.get(trinket.creatorId) ?? 'Unknown'
    const createdAt = `<t:${Date.parse(trinket.createdAt) / 1000}:f>`
    const updatedAt = `<t:${Date.parse(trinket.updatedAt) / 1000}:f>`
    
    if (hidden) {
        const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`${rarity} :question: ???`)
        .setDescription(`secret :)`)
        return embed
    }

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`${rarity} ${trinket.emoji} \`${trinket.name}\``)
        .setDescription(`ID: \`${trinket.id}\`\nOwned By: ${owner} since ${updatedAt}\nCreated By: ${creator} on ${createdAt}\n\n${trinket.description ?? ''}`)
        .setImage(trinket.image)

    return embed
}

async function checkImageUrl(url) {
    const res = await fetch(url);
    const buff = await res.blob();
    return buff.type.startsWith('image/')
}