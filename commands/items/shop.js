import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { Config, Users } from "../../database/objects.js"
import { or } from "sequelize"

export default {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Send without arguments to view the shop, or purchase something!')
        .addSubcommand((view) =>
            view
            .setName('view')
            .setDescription('View the shop!'))
        .addSubcommand((buy) =>
            buy
            .setName('buy')
            .setDescription('Purchase item(s)!')
            .addStringOption((item) => 
                item
                .setName('item')
                .setDescription('The item you want to buy')
                .setChoices([{name: 'Blank Trinket', value: 'Blank Trinket'}, {name: 'Blank Message', value: 'Blank Message'}])
                .setRequired(true))
            .addIntegerOption((amount) => 
                amount
                .setName('amount')
                .setDescription('The amount of items to buy, defaults to 1 if not set'))),
    async execute(interaction) {
        const response = await shop(interaction)
        await interaction.reply(response)
    },
}

async function shop(interaction) {
    try {
        const userId = interaction.user.id
        const guildId = interaction.guild.id
        const subcommand = interaction.options.getSubcommand('buy')
    
        const config = await Config.getConfig(guildId)
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
        
        //View Shop
        if (subcommand === 'view') { //If no arguments
            let shop = ``
            shop += `:package: \` Blank Trinket | ${config.shopTrinket} PP \` :package:\n`
            shop += `:envelope: \` Blank Message | ${config.shopMessage} PP \` :envelope:`

            embed.setTitle(`:moneybag: Placeholder Bot Shop :moneybag:`)
                 .setDescription(shop)

        //Purchase from shop
        } else {
            const user = await Users.getUser(userId, guildId)
            const item = interaction.options.getString('item')
            let amount = interaction.options.getInteger('amount')
            let cost = -1
            let success = false
            
            amount = amount ?? 1 //Amount defaults to 1 if undefined
            if (item === 'Blank Trinket') { //Elseif chain for items, don't like doing it this way but it works
                cost = config.shopTrinket * amount
                if (user.points >= cost) { 
                    Users.updateBalance(userId, guildId, (-1 * cost)) 
                    Users.increment('blankTrinkets', { by: amount, where: { userId: userId, guildId: guildId }})
                    success = true
                }
            } else if (item === 'Blank Message') {
                cost = config.shopMessage * amount
                if (user.points >= cost) { 
                    Users.updateBalance(userId, guildId, (-1 * cost)) 
                    Users.increment('blankMessages', { by: amount, where: { userId: userId, guildId: guildId }})
                    success = true
                }
            } else { //If invalid item is provided
                embed.setDescription(`Item "\`${item}\`" doesn't exist`)
                return { embeds: [embed] }
            }

            //Return message according to purchase success
            if (success) {
                embed.setTitle(`:white_check_mark: Successfully purchased \`${amount}\` \`${item}(s)\``)
                     .setDescription(`\`${cost} PP\` deducted from funds`)
            } else {
                embed.setTitle(`:x: Cannot afford \`${amount}\` \`${item}(s)\``)
                     .setDescription(`Purchase requires \`${cost} PP\`, you only have \`${user.points} PP\``)
            }
        }
        return { embeds: [embed] }
    } catch (e) {
        console.error(e)
        return e
    }
    
}