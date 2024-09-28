import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"
import { random, sleep, UpdateGachaChance } from "../../helpers.js"

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
    if (trinket === null) { //Roll failed
        embed.setTitle(`:x: ${interaction.user.displayName} got NOTHING!! :x:`)
    } else if (trinket === undefined) { //No trinkets in gacha
        embed.setTitle(`There are no trinkets left in the gacha!`)
             .setDescription(`Roll has been refunded`)
        Users.updateBalance(user.userId, user.guildId, config.gachaRollCost)
    } else { //Successful roll, reward trinket
        trinket.ownerId = user.userId
        trinket.hidden = false
        await trinket.save()
        await UpdateGachaChance(trinket.tier, interaction) //Update gacha changes to reflect new trinket count
        const reward = await forgeReward(trinket, interaction) //Give trinket creator point reward
        
        await interaction.guild.members.fetch() //Load all guild users into cache
        embed.setTitle(`:white_check_mark: ${interaction.user.displayName} got ${config[`rarityNameT${trinket.tier}`]} ${trinket.emoji}\`${trinket.name}\` \`(ID ${trinket.id})\` :white_check_mark: `)
             .setDescription(`Created by ${interaction.client.users.cache.get(trinket.creatorId) ?? 'Unknown'} on <t:${Date.parse(trinket.createdAt) / 1000}:f>\n\n${trinket.description ?? ''}`)
             .setImage(trinket.image)
        const rewardEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`Forgemaster ${(interaction.client.users.cache.get(trinket.creatorId)).displayName ?? 'Unknown'} got \`${reward} PP\``)

        await interaction.editReply({embeds: [embed, rewardEmbed]})
        return
    }
    await interaction.editReply({embeds: [embed]})
    return
}

export async function viewGacha(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const chances = interaction.client.gachaChances.get(interaction.guild.id)
    const trinkets = await Trinkets.getTrinkets(undefined, interaction.guild.id)

    const t1Header = `**--- ${config.rarityNameT1} Trinkets ---**\n`
    const t2Header = `**--- ${config.rarityNameT2} Trinkets ---**\n`
    const t3Header = `**--- ${config.rarityNameT3} Trinkets ---**\n`
    let tier1 = t1Header
    let tier2 = t2Header
    let tier3 = t3Header

    //List trinkets of each rarity
    for (const trinket of trinkets.filter(t => t.ownerId === 'gacha1')) { tier1 = tier1 + (!trinket.hidden ? `${trinket.emoji}\`${trinket.name}\` \`#${trinket.id}\`**,** ` : `:question:\`???\` \`#${trinket.id}\`**,** `)}
    for (const trinket of trinkets.filter(t => t.ownerId === 'gacha2')) { tier2 = tier2 + (!trinket.hidden ? `${trinket.emoji}**\`${trinket.name}\`** \`#${trinket.id}\`**,** ` : `:question:\`???\` \`#${trinket.id}\`**,** `)}
    for (const trinket of trinkets.filter(t => t.ownerId === 'gacha3')) { tier3 = tier3 + (!trinket.hidden ? `${trinket.emoji}***\`${trinket.name}\`*** \`#${trinket.id}\`**,** ` : `:question:\`???\` \`#${trinket.id}\`**,** `)}

    //If there are no trinkets of rarity, list "NOTHING". Otherwise, remove the last comma in the list
    if (tier1 === t1Header) { tier1 = tier1 + '`NOTHING!`'}
    else { tier1 = tier1.substring(0, tier1.lastIndexOf('**,**')) }
    if (tier2 === t2Header) { tier2 = tier2 + '`NOTHING!`'}
    else { tier2 = tier2.substring(0, tier2.lastIndexOf('**,**')) }
    if (tier3 === t3Header) { tier3 = tier3 + '`NOTHING!`'}
    else { tier3 = tier3.substring(0, tier3.lastIndexOf('**,**')) }
    
    let description = `${config.rarityNameT1} Chance: \`${chances.get(1)}%\`\n${config.rarityNameT2} Chance: \`${chances.get(2)}%\`\n${config.rarityNameT3} Chance: \`${chances.get(3)}%\`\n\n${tier3}\n\n${tier2}\n\n${tier1}`
    let embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`:mag_right: Trinket Roll Information :mag:`)
            .setDescription(description)
    await interaction.reply({embeds: [embed]})
}

export async function forgeReward(trinket, interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const creator = await Users.getUser(trinket.creatorId, interaction.guild.id)

    const days = (Date.parse(trinket.updatedAt) - Date.parse(trinket.createdAt)) / (1000 * 3600 * 24)
    let interest = (config[`trinketCostT${trinket.tier}`] * config.forgeRewardRatio)
    for (let i = 0; i < Math.floor(days); i++) {
        interest += interest * config[`forgeRewardDailyT${trinket.tier}`]
    }
    interest = Math.ceil(interest)

    Users.updateBalance(creator.userId, creator.guildId, interest)
    return interest
}