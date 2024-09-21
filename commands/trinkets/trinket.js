import { EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"
import emojiRegex from "emoji-regex-xs"

export default {
    data: new SlashCommandBuilder()
        .setName('trinket')
        .setDescription('Tests a basic command!')
        //Trinket view command
        .addSubcommand((view) => (
            view
            .setName('view')
            .setDescription('View a specific trinket')
        ))
        //Trinket creation command
        .addSubcommand((create) => (
            create
            .setName('create')
            .setDescription('Create a new trinket! Costs Placeholder Points to use, type /shop to view this server\'s prices!')
            .addIntegerOption((int) => (
                int
                .setName('tier')
                .setDescription('The trinket\'s rarity, affects cost')
                .setRequired(true)
                .addChoices([{name: 'Tier 1', value: 1}, {name: 'Tier 2', value: 2}, {name: 'Tier 3', value: 3}])
            ))
            .addStringOption((string) => (
                string
                .setName('name')
                .setDescription('The trinket\'s name, 64 character limit')
                .setRequired(true)
            ))
            .addStringOption((string) => (
                string
                .setName('emoji')
                .setDescription('The trinket\'s emoji icon, must be from this server and non-animated')
                .setRequired(true)
            ))
            .addStringOption((string) => (
                string
                .setName('image')
                .setDescription('URL of the trinket\'s image, 512 character limit')
                .setRequired(false)
            ))
            .addStringOption((string) => (
                string
                .setName('lore')
                .setDescription('The trinket\'s item description, 1024 character limit')
                .setRequired(false)
            ))
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
        var embed = await create(interaction, config)
    } else if (command === 'view') {
        var embed = view(interaction, config)
    } else {
        return `Command "\`${command}\`" not found`
    }

    return {embeds: [embed]}
}

async function create(interaction, config) {
    const guildId = interaction.guild.id
    const tier = interaction.options.getInteger('tier')
    const name = interaction.options.getString('name')
    const emoji = interaction.options.getString('emoji')
    const image = interaction.options.getString('image')
    const lore = interaction.options.getString('lore')
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`:x: Failed to create trinket :x:`)
    
    //Validation
    if (!(emoji.match(emojiRegex()) || emoji.match(/<:.+?:\d+>$/))) { //This custom emote regex is a shitty solution, it doesn't stop emotes from other servers and matches with invalid emotes (eg <:slurslurslurs:1>)
        return embed.setDescription(`Invalid emoji`)                  //There is a way to check if the bot can use the emote but, I'm too lazy and this is a private bot. Fuck you whoever inevitably makes me fix this :(   
    } else if (!(image === null || checkImageUrl(image))) {
        return embed.setDescription(`Invalid image URL. Make sure you are directly linking the image`)
    } //Character length limits
    else if (name.length > 64) { //Felt right
        return embed.setDescription(`Name has a character limit of 64. Your name was ${name.length} characters long`)
    } else if (emoji.length > 64) { //Custom emojis should never be longer than 56 characters and this felt right
        return embed.setDescription(`Emoji has a character limit of 64. Your "emoji" was ${emoji.length} characters long`)
    } else if (lore.length > 1024) { //Due to 2000 char message limit
        return embed.setDescription(`Description has a character limit of 1024. Your description was ${lore.length} characters long`)
    } else if (image.length > 512) { //1664 characters max user input, so we should never hit the 2000 limit if this info ever gets sent as a raw message
        return embed.setDescription(`Image URL has a character limit of 512. Your URL was ${image.length} characters long`)
    }

    //Check balances, deduct points, and create trinket
    const user = await Users.getUser(interaction.user.id, guildId)
    if (tier === 1) {
        if (user.points < config.trinketT1Cost) {
            return embed.setDescription(`Tier 1 trinkets require \`${config.trinketT1Cost} PP\`, you have \`${user.points} PP\``)
        }
        await Users.updateBalance(user.userId, user.guildId, -1*config.trinketT1Cost)
    }
    else if (tier === 2) {
        if (user.points < config.trinketT2Cost) {
            return embed.setDescription(`Tier 2 trinkets require \`${config.trinketT2Cost} PP\`, you have \`${user.points} PP\``)
        }
        await Users.updateBalance(user.userId, user.guildId, -1*config.trinketT2Cost)
    }
    else if (tier === 3) {
        if (user.points < config.trinketT3Cost) {
            return embed.setDescription(`Tier 3 trinkets require \`${config.trinketT3Cost} PP\`, you have \`${user.points} PP\``)
        }
        await Users.updateBalance(user.userId, user.guildId, -1*config.trinketT3Cost)
    }

    await Trinkets.addTrinket(tier, name, emoji, image, lore, user.userId, guildId)

    embed.setTitle(`\`${emoji} ${name}\` successfully created!`)
         .setDescription(`Trinket has been added to the tier ${tier} gacha`)
    return embed
}

async function view(interaction, config) {

}

async function checkImageUrl(url) {
    const res = await fetch(url);
    const buff = await res.blob();
    return buff.type.startsWith('image/')
}