import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"
import { random, sleep, UpdateGachaChance } from "../../helpers.js"

export async function displayGacha(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const user = await Users.getUser(interaction.user.id, interaction.guild.id)
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`:tickets: GAMBLING !!! :tickets:`)
        .setDescription(`Press button to roll for \`${config.gachaRollCost} PP\``)
    
    const buttonRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('gachaRoll')
                .setLabel(`Pull!`)
                .setEmoji(`🎲`)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('gachaView')
                .setLabel(`View Info`)
                .setEmoji(`🔎`)
                .setStyle(ButtonStyle.Secondary)
        )

    return {embeds: [embed], components: [buttonRow]}
}

export async function rollGacha(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const user = await Users.getUser(interaction.user.id, interaction.guild.id)
    
    let embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`:game_die: ${interaction.user.displayName} is rolling`)

    //Confirm eligability and deduct points
    if (user.points < config.gachaRollCost) {
        embed.setTitle(`:x: Roll failed :x:`)
             .setDescription(`Not enough points. Roll requires \`${config.gachaRollCost} PP\`, you have \`${user.points} PP\``)
             await interaction.reply({embeds: [embed]})
        return
    }
    Users.updateBalance(user.userId, user.guildId, -1*config.gachaRollCost)
    await interaction.reply({embeds: [embed]})

    //Start async cosmetic rolling, WIP, maybe replace with available trinket icons cycling?
    let dots = ''
    const animate = async () => {
        for (let i = 0; i < 4; i++) {
            dots += '.'
            embed.setTitle(`:game_die: ${interaction.user.displayName} is rolling${dots}`)
            await interaction.editReply({embeds: [embed]})
            await sleep(200)
        }
        return
    } 
    const animationDone = animate()

    //Roll
    const gachaChances = interaction.client.gachaChances.get(interaction.guild.id)
    //Each chance value is equal to 100 minus the chance of rolling that tier or higher
    const chances = [ 100 - (gachaChances.get(1) + gachaChances.get(2) + gachaChances.get(3)),  100 - (gachaChances.get(2) + gachaChances.get(3)), 100 - gachaChances.get(3)]
    const result = random(1, 100)
    console.log(chances, result)

    var trinket
    const selectTrinket = async (tier) => {
        if (tier <= 0) { return undefined }
        const trinkets = await Trinkets.getTrinkets(undefined, user.guildId, `gacha${tier}`)
        const length = trinkets.length
        if (length <= 0) {
            return await selectTrinket(tier - 1)
        } else {
            const result = random(0, length - 1)
            return trinkets[result]
        }
    }
    if (result <= chances[0]) {
        trinket = null
    } else if (result > chances[2]) {
        trinket = await selectTrinket(3)
    } else if (result > chances[1]) {
        trinket = await selectTrinket(2)
    } else if (result > chances[0]) {
        trinket = await selectTrinket(1)
    }
    
    //Wait for animation to finish
    await animationDone

    //Handle result
    if (trinket === null) {
        embed.setTitle(`:x: ${interaction.user.displayName} got NOTHING!! :x:`)
    } else if (trinket === undefined) {
        embed.setTitle(`There are no trinkets left in the gacha!`)
             .setDescription(`Roll has been refunded`)
        Users.updateBalance(user.userId, user.guildId, config.gachaRollCost)
    } else {
        trinket.ownerId = user.userId
        await trinket.save()
        await UpdateGachaChance(trinket.tier, -1, interaction)
        
        embed.setTitle(`:white_check_mark: ${interaction.user.displayName} got the ${config[`rarityNameT${trinket.tier}`]} ${trinket.emoji}\`${trinket.name}\` \`(ID ${trinket.id})\` :white_check_mark: `)
             .setDescription(`Created by ${interaction.client.users.cache.get(trinket.creatorId) ?? 'Unknown'} on <t:${Date.parse(trinket.createdAt) / 1000}:f>`)
             .setImage(trinket.image)
    }
    
    await interaction.editReply({embeds: [embed]})
}

export async function viewGacha(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const chances = interaction.client.gachaChances.get(interaction.guild.id)
    const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id)

    let tier1 = `:third_place: **${config.rarityNameT1} Trinkets** :third_place:\n`
    let tier2 = `:second_place: **${config.rarityNameT2} Trinkets** :second_place:\n`
    let tier3 = `:first_place: **${config.rarityNameT3} Trinkets** :first_place:\n`

    for (const trinket of trinkets.filter(t => t.ownerId === 'gacha1')) { tier1 = tier1 + `${trinket.emoji}\`${trinket.name}\` \`${trinket.id}\`**,** `}
    for (const trinket of trinkets.filter(t => t.ownerId === 'gacha2')) { tier2 = tier2 + `${trinket.emoji}\`${trinket.name}\` \`${trinket.id}\`**,** `}
    for (const trinket of trinkets.filter(t => t.ownerId === 'gacha3')) { tier3 = tier3 + `${trinket.emoji}\`${trinket.name}\`**,** `}

    if (tier1 === `:third_place: **${config.rarityNameT1} Trinkets** :third_place:\n`) { tier1 = tier1 + '`NOTHING!`'}
    else { tier1 = tier1.substring(0, tier1.lastIndexOf('**,**')) }
    if (tier2 === `:second_place: **${config.rarityNameT2} Trinkets** :second_place:\n`) { tier2 = tier2 + '`NOTHING!`'}
    else { tier2 = tier2.substring(0, tier2.lastIndexOf('**,**')) }
    if (tier3 === `:first_place: **${config.rarityNameT3} Trinkets** :first_place:\n`) { tier3 = tier3 + '`NOTHING!`'}
    else { tier3 = tier3.substring(0, tier3.lastIndexOf('**,**')) }
    
    let description = `${config.rarityNameT1} Chance: \`${chances.get(1)}%\`\n${config.rarityNameT2} Chance: \`${chances.get(2)}%\`\n${config.rarityNameT3} Chance: \`${chances.get(3)}%\`\n\n${tier3}\n\n${tier2}\n\n${tier1}`
    let embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`:mag_right: Gacha Information :mag:`)
            .setDescription(description)
    await interaction.reply({embeds: [embed]})
}