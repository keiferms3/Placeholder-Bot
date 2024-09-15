import { SlashCommandBuilder } from "discord.js"
import { Config, Users } from "../../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Send without arguments to view the shop, or purchase something!')
        .addStringOption((item) => 
            item
            .setName('item')
            .setDescription('The item you want to buy')
            .setChoices([{name: 'Blank Trinket', value: 'Blank Trinket'}, {name: 'Blank Message', value: 'Blank Message'}]))
        .addIntegerOption((amount) => 
            amount
            .setName('amount')
            .setDescription('The amount of items to buy, defaults to 1 if not set')),
    async execute(interaction) {
        const response = await shop(interaction)
        await interaction.reply(response)
    },
}

async function shop(interaction) {
    try {
        const userId = interaction.user.id
        const guildId = interaction.guild.id
        const item = interaction.options.getString('item')
        let amount = interaction.options.getInteger('amount')
    
        const config = await Config.getConfig(guildId)
        
        //View Shop
        if (!item && !amount) { //If no arguments
            let shop = `----- Placeholder Bot Shop -----\n`
            shop += `:package: \` Blank Trinket | ${config.shopTrinket} PP \` :package:\n`
            shop += `:envelope: \` Blank Message | ${config.shopMessage} PP \` :envelope:`
            return shop

        //Purchase from shop
        } else {
            const user = await Users.getUser(userId, guildId)
            
            amount = amount ?? 1 //Amount defaults to 1 if undefined
            if (!item) {
                return `You must specify an item to purchase`
            } else if (item === 'Blank Trinket') {
                if (user.points >= config.shopTrinket) { 
                    Users.updateBalance(userId, guildId, -1 * config.shopTrinket) 
                    Users.increment('blankTrinkets', { by: amount, where: { userId: userId, guildId: guildId }})
                    return `Successfully purchased \`${item}\``
                }
            } else if (item === 'Blank Message') {
                if (user.points >= config.shopMessage) { 
                    Users.updateBalance(userId, guildId, -1 * config.shopMessage) 
                    Users.increment('blankMessages', { by: amount, where: { userId: userId, guildId: guildId }})
                    return `Successfully purchased \`${item}\``
                }
            } else {
                return `??? dumbass`
            }
            return `Cannot afford item(s)`
        }
    } catch (e) {
        console.error(e)
        return e
    }
    
}