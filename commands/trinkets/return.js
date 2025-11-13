import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js"
import { Config, Trinkets, Users } from "../../database/objects.js"
import { UpdateGachaChance } from "../../helpers.js"

export async function trinketReturn(interaction) {
    const config = await Config.getConfig(interaction.guild.id)
    const id = interaction.options.getInteger('id')
    const components = []
    let buttons = false

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
    const trinket = await Trinkets.getTrinkets(id, interaction.guild.id)
    if (trinket && trinket.ownerId === interaction.user.id) {
        //TODO, a lot, move all the returning stuff outta here, fix button handling such as checking user press, figure out how to communicate trinket between functions
        embed.setTitle(`Are you sure you want to return ${config[`rarityNameT${trinket.tier}`]} ${trinket.emoji}\`${trinket.name}\` \`(ID ${trinket.trinketId})\` to the gacha?`)
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
        try {
            var button = await reply.awaitMessageComponent({ time: 300_000 })
        } catch {
            embed.setTitle(`Return request timed out after 5 minutes`)
            reply.editReply({embeds: [embed], components: [], content: ''})
            return
        }

        const buttonId = button.customId
        if (buttonId === 'returnConfirm') {
            trinket.ownerId = `gacha${trinket.tier}`
            trinket.returned = true
            trinket.save()
            await UpdateGachaChance(trinket.tier, interaction)
            embed.setTitle(`:white_check_mark: ${interaction.user.displayName} returned ${config[`rarityNameT${trinket.tier}`]} ${trinket.emoji}\`${trinket.name}\` \`(ID ${trinket.trinketId})\` to the gacha! :white_check_mark:`)
                 .setDescription(`\`${Math.round(config[`trinketCostT${trinket.tier}`]*config[`returnRatioT${trinket.tier}`])} PP\` added to balance`)
                 Users.updateBalance(interaction.user.id, interaction.guild.id, (Math.round(config[`trinketCostT${trinket.tier}`]*config[`returnRatioT${trinket.tier}`])))
            await interaction.followUp({embeds: [embed], components: []})
        } else if (buttonId === 'returnCancel') {
            embed.setTitle('Return canceled')
            await reply.edit({embeds: [embed], components: []})
        }
    }
}