import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js"
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
        ))
        //Trinket return subcommand
        .addSubcommand((scrap) => (
            scrap
            .setName('return')
            .setDescription('Return a trinket to the gacha for its creation value')
            .addIntegerOption((int) => (
                int
                .setName('id')
                .setDescription('Trinket\'s unique ID number')
                .setRequired(true)
            ))
        )),
    async execute(interaction) {
        try {
            const command = interaction.options.getSubcommand()
            if (command === 'create') {
                var response = await create(interaction)
            } 
            else if (command === 'roll') {
                var response = await displayGacha(interaction)
            } 
            else if (command === 'view') {
                var response = await view(interaction)
            } 
            else if (command === 'search') {
                var response = await search(interaction)
            } 
            else if (command === 'return') {
                var response = await trinketReturn(interaction)
                return
            } 
            else {
                var response = `Tinket command "\`${command}\`" not found`
            }

            await interaction.reply(response)

        } catch (e) {
            console.error(e)
        }
    },
}

async function create(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const guildId = interaction.guild.id
    const tier = interaction.options.getInteger('rarity')
    const name = interaction.options.getString('name')
    const emojiString = interaction.options.getString('emoji')
    const image = interaction.options.getString('image')
    const lore = interaction.options.getString('description')
    let ephemeral = interaction.options.getBoolean('hidden')
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`:x: Failed to create trinket :x:`)

    //Validation
    if (image !== null) { //If image exists
        const isValidImage = await checkImageUrl(image) //Await validation
        if (!isValidImage) {
            return {embeds: [embed.setDescription(`Invalid image URL. Make sure you are directly linking the image`)]}
        }
    }
    if (!(emojiString.match(emojiRegex()) || emojiString.match(/<:.+?:\d+>$/))) { //This custom emote regex is a shitty solution, it doesn't stop emotes from other servers and matches with invalid emotes (eg <:slurslurslurs:1>)
        return embed.setDescription(`Invalid emoji`)                  //There is a way to check if the bot can use the emote but, I'm too lazy and this is a private bot. Fuck you whoever inevitably makes me fix this :(   
    } 
    const emoji = emojiString.match(emojiRegex()) ? emojiString.match(emojiRegex())[0] : emojiString
    //Character length limits
    if (name.length > 64) { //Felt right
        return embed.setDescription(`Name has a character limit of 64. Your name was ${name.length} characters long`)
    } else if (emoji.length > 64) { //Custom emojis should never be longer than 56 characters and this felt right
        return embed.setDescription(`Emoji has a character limit of 64. Your "emoji" was ${emojiString.length} characters long`)
    } else if (lore && lore.length > 1200) { //Due to 2000 char message limit
        return embed.setDescription(`Description has a character limit of 1200. Your description was ${lore.length} characters long`)
    } else if (image && image.length > 512) { //1840 characters max user input, so we should never hit the 2000 limit if this info ever gets sent as a raw message
        return embed.setDescription(`Image URL has a character limit of 512. Your URL was ${image.length} characters long`)
    }

    //Check balances, deduct points, and create trinket
    const user = await Users.getUser(interaction.user.id, guildId)
    if (user.points < config[`trinketCostT${tier}`]) {
        embed.setDescription(`${config[`rarityNameT${tier}`]} trinkets require \`${config[`trinketCostT${tier}`]} PP\`, you have \`${user.points} PP\``)
        return {embeds: [embed]}
    }
    await Users.updateBalance(user.userId, user.guildId, -1*config[`trinketCostT${tier}`])

    const trinket = await Trinkets.addTrinket(tier, name, emoji, image, lore, user.userId, guildId, ephemeral, interaction)
    UpdateGachaChance(tier, interaction)

    embed.setTitle(`${config[`rarityNameT${tier}`]} trinket ${emoji}\`${name}\` \`(ID ${trinket.id})\` successfully created!`)
         .setDescription(lore)
         .setImage(image)
    return {embeds: [embed], ephemeral: ephemeral}
}

async function view(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const id = interaction.options.getInteger('id')
    let ephemeral = interaction.options.getBoolean('hidden')

    let embed
    const trinket = await Trinkets.getTrinkets(id)
    if (trinket) {
        if (ephemeral && trinket.creatorId === interaction.user.id) { 
            embed = await display(trinket, interaction, config, false) //If owner calls hidden view
        } else {
            embed = await display(trinket, interaction, config, trinket.hidden)
        }
        
    } else {
        embed = new EmbedBuilder().setTitle(`:x: Trinket \`ID ${id}\` doesn't exist :x:`)
        ephemeral = true
    }
    return {embeds: [embed], ephemeral: ephemeral}
}

async function search(interaction) {
    
}

async function trinketReturn(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const id = interaction.options.getInteger('id')
    const components = []
    let buttons = false

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
    const trinket = await Trinkets.getTrinkets(id)
    if (trinket && trinket.ownerId === interaction.user.id) {
        //TODO, a lot, move all the returning stuff outta here, fix button handling such as checking user press, figure out how to communicate trinket between functions
        embed.setTitle(`Are you sure you want to return ${config[`rarityNameT${trinket.tier}`]} ${trinket.emoji}\`${trinket.name}\` \`(ID ${trinket.id})\` to the gacha?`)
        components.push(new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`returnConfirm`)
                    .setLabel(`Return`)
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`returnCancel`)
                    .setLabel(`Cancel`)
                    .setStyle(ButtonStyle.Secondary),
        ))
        
        buttons = true
        
    } else if (trinket) {
        embed.setTitle(`:x: You don't own trinket \`ID ${id}\` :x:`)
    } else {
        embed.setTitle(`:x: Trinket \`ID ${id}\` doesn't exist :x:`)
    }
    const reply = await interaction.reply({embeds: [embed], components: components, ephemeral: true})

    if(buttons) {
        const button = await reply.awaitMessageComponent({ time: 300_000 })

        const buttonId = button.customId
        if (buttonId === 'returnConfirm') {
            trinket.ownerId = `gacha${trinket.tier}`
            trinket.save()
            embed.setTitle(`:white_check_mark: ${interaction.user.displayName} returned ${config[`rarityNameT${trinket.tier}`]} ${trinket.emoji}\`${trinket.name}\` \`(ID ${trinket.id})\` to the gacha! :white_check_mark:`)
                 .setDescription(`\`${config[`trinketCostT${trinket.tier}`]} PP\` added to balance`)
                 Users.updateBalance(interaction.user.id, interaction.guild.id, config[`trinketCostT${trinket.tier}`])
            
            await interaction.followUp({embeds: [embed], components: []})
        } else if (buttonId === 'returnCancel') {
            embed.setTitle('Return canceled')
            await reply.edit({embeds: [embed], components: []})
        }
    }
    

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

//Returns true if url is a direct image link
async function checkImageUrl(url) {
    const res = await fetch(url);
    const buff = await res.blob();
    return buff.type.startsWith('image/')
}