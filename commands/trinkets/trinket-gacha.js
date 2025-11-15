import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"
import { randomInt, randomFloat, sleep, UpdateGachaChance } from "../../helpers.js"

export async function displayGacha(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const ephemeral = interaction.options.getBoolean('hidden')
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`:tickets: Trinket Roulette :tickets:`)
        .setDescription(`Press button to roll for \`${config.gachaRollCost} PP\``)
    
    const buttonRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('gachaRoll')
                .setLabel(`Roll!`)
                .setEmoji(`🎲`)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('gachaView')
                .setLabel(`View Info`)
                .setEmoji(`🔎`)
                .setStyle(ButtonStyle.Secondary)
        )

    return {embeds: [embed], components: [buttonRow], ephemeral: ephemeral}
}

export async function rollGacha(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const user = await Users.getUser(interaction.user.id, interaction.guild.id)
    const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id)

    
    const gachaTrinkets = [trinkets.filter(t => t.ownerId === 'gacha1'), trinkets.filter(t => t.ownerId === 'gacha2'), trinkets.filter(t => t.ownerId === 'gacha3')]
    gachaTrinkets.unshift(gachaTrinkets[0].concat(gachaTrinkets[1], gachaTrinkets[2]))
    
    let embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${gachaTrinkets[0][randomInt(0, gachaTrinkets[0].length - 1)]?.emoji ?? `:game_die:`} ${interaction.user.displayName} is rolling`)

    //Confirm eligability and deduct points
    if (user.points < config.gachaRollCost) {
        embed.setTitle(`:x: Roll failed :x:`)
             .setDescription(`Not enough points. Roll requires \`${config.gachaRollCost} PP\`, you have \`${user.points} PP\``)
             await interaction.reply({embeds: [embed]})
        return
    }
    Users.updateBalance(user.userId, user.guildId, -1*config.gachaRollCost)
    await interaction.reply({embeds: [embed]})

    //Start async cosmetic rolling
    const animate = async () => {
        let dots = ''
        for (let i = 0; i < 6; i++) {
            dots += '.'
            let rand = randomInt(0, gachaTrinkets[0].length - 1)
            embed.setTitle(`${gachaTrinkets[0][rand]?.emoji ?? `:game_die:`} ${interaction.user.displayName} is rolling${dots}`)
            await interaction.editReply({embeds: [embed]})
            await sleep(200)
        }
        return
    } 
    const animationDone = animate()

    //Roll
    const gachaChances = interaction.client.gachaChances.get(interaction.guild.id)
    //Each chance value is equal to 100 minus the chance of rolling that tier or higher
    const chances = [ gachaChances.get(3), gachaChances.get(3) + gachaChances.get(2), gachaChances.get(3) + gachaChances.get(2) + gachaChances.get(1)] //T3, T2, T1 chances
    const result = randomFloat(0, 100)

    var trinket
    const selectTrinket = (tier) => {
        if (tier <= 0) { return undefined }
        //const tierTrinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id, `gacha${tier}`)
        if (gachaTrinkets[tier].length <= 0) {
            return selectTrinket(tier - 1)
        } else {
            const result = randomInt(0, gachaTrinkets[tier].length - 1)
            return gachaTrinkets[tier][result]
        }
    }
    //Lower roll is better, result must be less than or equal to a chance value
    if (result > chances[2]) {
        trinket = null
    } else if (result <= chances[0]) {
        trinket = selectTrinket(3)
    } else if (result <= chances[1]) {
        trinket = selectTrinket(2)
    } else if (result <= chances[2]) {
        trinket = selectTrinket(1)
    }
    
    //Wait for animation to finish
    await animationDone

    //Handle result
    if (trinket === null) { //Roll failed
        embed.setTitle(`:x: ${interaction.user.displayName} got NOTHING!! :x:`)
    } else if (trinket === undefined) { //No trinkets in gacha
        embed.setTitle(`There are no trinkets left in the gacha!`)
             .setDescription(`Roll has been refunded`)
        Users.updateBalance(user.userId, user.guildId, config.gachaRollCost)
    } else { //Successful roll, reward trinket
        const hiddden = trinket.hidden ? 'Hidden ' : ''
        const embeds = []

        trinket.ownerId = user.userId
        trinket.hidden = false
        await trinket.save()

        await UpdateGachaChance(trinket.tier, interaction) //Update gacha changes to reflect new trinket count
        const reward = await forgeReward(trinket, interaction) //Give trinket creator point reward

        const creator = interaction.client.users.cache.get(trinket.creatorId)
        embed.setTitle(`:white_check_mark: ${interaction.user.displayName} got ${hiddden}${config[`rarityNameT${trinket.tier}`]} ${trinket.emoji}\`${trinket.name}\` \`(ID ${trinket.trinketId})\` :white_check_mark: `)
             .setDescription(`Created by ${creator ?? 'Unknown'} on <t:${Date.parse(trinket.createdAt) / 1000}:f>\n\n${trinket.description ?? ''}`)
             .setImage(trinket.image)
        embeds.push(embed)
        if (reward > 0) {
            const rewardEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`Forgemaster ${creator?.displayName ?? 'Unknown'} got \`${reward} PP\``)
            embeds.push(rewardEmbed)
        }

        await interaction.editReply({embeds: embeds})
        return
    }
    await interaction.editReply({embeds: [embed]})
    return
}

export async function viewGacha(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const chances = interaction.client.gachaChances.get(interaction.guild.id)
    const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id)

    const tier1 = trinkets.filter(t => t.ownerId === 'gacha1')
    const tier2 = trinkets.filter(t => t.ownerId === 'gacha2')
    const tier3 = trinkets.filter(t => t.ownerId === 'gacha3')

    const t1Header = `**--- ${config.rarityNameT1} Trinkets ---** \`(${tier1.length})\`\n`
    const t2Header = `**--- ${config.rarityNameT2} Trinkets ---** \`(${tier2.length})\`\n`
    const t3Header = `**--- ${config.rarityNameT3} Trinkets ---** \`(${tier3.length})\`\n`
    let tier1Str = t1Header
    let tier2Str = t2Header
    let tier3Str = t3Header

    //List trinkets of each rarity
    for (const trinket of tier1) { tier1Str = tier1Str + (!trinket.hidden ? `${trinket.emoji}\`${trinket.name}\` \`#${trinket.trinketId}\`**,** ` : `:question:\`???\` \`#${trinket.trinketId}\`**,** `)}
    for (const trinket of tier2) { tier2Str = tier2Str + (!trinket.hidden ? `${trinket.emoji}**\`${trinket.name}\`** \`#${trinket.trinketId}\`**,** ` : `:question:\`???\` \`#${trinket.trinketId}\`**,** `)}
    for (const trinket of tier3) { tier3Str = tier3Str + (!trinket.hidden ? `${trinket.emoji}***\`${trinket.name}\`*** \`#${trinket.trinketId}\`**,** ` : `:question:\`???\` \`#${trinket.trinketId}\`**,** `)}

    //If there are no trinkets of rarity, list "NOTHING". Otherwise, remove the last comma in the list
    if (tier1Str === t1Header) { tier1Str = tier1Str + '`NOTHING!`'}
    else { tier1Str = tier1Str.substring(0, tier1Str.lastIndexOf('**,**')) }
    if (tier2Str === t2Header) { tier2Str = tier2Str + '`NOTHING!`'}
    else { tier2Str = tier2Str.substring(0, tier2Str.lastIndexOf('**,**')) }
    if (tier3Str === t3Header) { tier3Str = tier3Str + '`NOTHING!`'}
    else { tier3Str = tier3Str.substring(0, tier3Str.lastIndexOf('**,**')) }
    
    //To prevent embed description from getting cut off if too long, divide description into multiple embeds ~1300 characters long
    let description = `${config.rarityNameT1} Chance: \`${+chances.get(1).toFixed(2)}%\`\n${config.rarityNameT2} Chance: \`${+chances.get(2).toFixed(2)}%\`\n${config.rarityNameT3} Chance: \`${+chances.get(3).toFixed(2)}%\`\n\n${tier3Str}\n\n${tier2Str}\n\n${tier1Str}`
    
    const CHUNK_SIZE = 1300
    const chunkCount = Math.ceil(description.length / CHUNK_SIZE)
    const embeds = []
    let index = 0
    for (let i = 0; i < chunkCount; i++) {
        const lastIndex = index
        index = description.indexOf('**,** ', (i+1)*CHUNK_SIZE) 
        index = (index === -1) ? (i+1)*CHUNK_SIZE : index + 5

        const embed = new EmbedBuilder().setColor(config.embedColor)
        if (i === 0) {
            embed.setTitle(`:mag_right: Trinket Roll Information :mag:`)
        }
        embed.setDescription(description.substring(lastIndex, index))
        embeds.push(embed)
    }

    await interaction.reply({embeds: embeds})
}

export async function forgeReward(trinket, interaction, updateBal = true) {
    const config = await Config.getConfig(interaction.guild.id)
    const creator = await Users.getUser(trinket.creatorId, interaction.guild.id)

    if (trinket.returned) {
        return 0
    }

    const days = (Date.now() - Date.parse(trinket.createdAt)) / (1000 * 3600 * 24)
    let interest = (config[`trinketCostT${trinket.tier}`] * config.forgeRewardRatio)
    const fullDays = Math.floor(days) //Find number of full days of interest to accrue
    for (let i = 0; i < fullDays; i++) { //Accrue compounding interest
        interest += interest * config[`forgeRewardDailyT${trinket.tier}`]
    }
    interest += interest * (config[`forgeRewardDailyT${trinket.tier}`] * (days - fullDays)) //Accrue unfinshed day's interest
    interest = Math.round(interest)

    const maxInterest = config[`trinketCostT${trinket.tier}`] * config.forgeRewardMaxInterestMultiplier
    if ((interest > maxInterest) && config.forgeRewardMaxInterestMultiplier > 0) { //Enforce maximum interest gain
        interest = maxInterest
    }

    if (updateBal) { //If updateBal is false, this function can be used to just calculate the reward value
        await Users.updateBalance(creator.userId, creator.guildId, interest)
    }
    
    return interest
}