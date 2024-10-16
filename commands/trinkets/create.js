import { EmbedBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"
import emojiRegex from "emoji-regex-xs"
import { UpdateGachaChance } from "../../helpers.js"

export async function create(interaction) {
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

    embed.setTitle(`${config[`rarityNameT${tier}`]} trinket ${emoji}\`${name}\` \`(ID ${trinket.trinketId})\` successfully created!`)
         .setDescription(lore)
         .setImage(image)
    return {embeds: [embed], ephemeral: ephemeral}
}

//Returns true if url is a direct image link
export async function checkImageUrl(url) {
    try {
        const res = await fetch(url)
        const buff = await res.blob()
        return buff.type.startsWith('image/')
    } catch {
        return false
    }
}