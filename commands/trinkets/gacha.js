import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"
import { random, sleep } from "../../helpers.js"

export default {
    data: new SlashCommandBuilder()
        .setName('gacha')
        .setDescription(`It's technically not gambling!`),
    async execute(interaction) {
        try {
            const response = await displayGacha(interaction)
            await interaction.reply(response)
        } catch (e) {
            console.error(e)
        }
        
    },
}

async function displayGacha(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const user = await Users.getUser(interaction.user.id, interaction.guild.id)
    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`:admissions_ticket: GAMBLING !!! :admissions_ticket:`)
        .setDescription(`Press button to roll for ${config.gachaRollCost}`)
    
    const buttonRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('gachaRoll')
                .setLabel(`Pull!`)
                .setEmoji(`🎲`)
                .setStyle(ButtonStyle.Success)
        )

    //0 = 0, 1 = 0+1, 2 = 0+1+2, 3 = 0+1+2+3
    

    // for (let i = 0; i < 1; i++) {
        
    // }

    return {embeds: [embed], components: [buttonRow]}
}

export async function rollGacha(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const user = await Users.getUser(interaction.user.id, interaction.guild.id)
    
    let dots = '..'
    let embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`Rolling${dots}`)
    await interaction.reply({embeds: [embed]})

    //Confirm eligability and deduct points
    if (user.points < config.gachaRollCost) {
        embed.setTitle(`:x: Roll failed :x:`)
             .setDescription(`Not enough points. Roll requires \`${config.gachaRollCost} PP\`, you have \`${user.points} PP\``)
             await interaction.editReply({embeds: [embed]})
    }
    Users.updateBalance(user.userId, user.guildId, -1*config.gachaRollCost)

    //Start async cosmetic rolling
    const animate = async () => {
        for (let i = 0; i < 5; i++) {
            dots += '.'
            embed.setTitle(`${interaction.user.displayName} is rolling${dots}`)
            await interaction.editReply({embeds: [embed]})
            await sleep(200)
        }
        return
    } 
    const animationDone = animate()

    //Roll
    const chances = [ config.gachaT0Chance, config.gachaT0Chance + config.gachaT1Chance, config.gachaT0Chance + config.gachaT1Chance + config.gachaT2Chance, config.gachaT0Chance + config.gachaT1Chance + config.gachaT2Chance + config.gachaT3Chance, ]
    const result = random(1, chances[3])

    var trinket
    const selectTrinket = async (tier) => {
        if (tier <= 0) { return undefined }
        const trinkets = await Trinkets.getTrinkets(undefined, `gacha${tier}`)
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
    } else if (result <= chances[1]) {
        trinket = await selectTrinket(1)
    } else if (result <= chances[2]) {
        trinket = await selectTrinket(2)
    } else if (result <= chances[3]) {
        trinket = await selectTrinket(3)
    }
    
    //Wait for animation to finish
    await animationDone

    //Handle result
    if (trinket === null) {
        embed.setTitle(`Roll failed :( Better luck next time`)
    } else if (trinket === undefined) {
        embed.setTitle(`There are no trinkets left in the gacha!`)
             .setDescription(`Roll has been refunded`)
        Users.updateBalance(user.userId, user.guildId, config.gachaRollCost)
    } else {
        trinket.ownerId = user.userId
        await trinket.save()

        embed.setTitle(`SUCCESS! You got a tier ${trinket.tier} \`${trinket.emoji} ${trinket.name}\``)
             .setDescription(trinket.description)
             .setImage(trinket.image)
    }
    
    await interaction.editReply({embeds: [embed]})
}

