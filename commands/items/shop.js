import { SlashCommandBuilder } from "discord.js"

export default {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Send without arguments to view the shop, or purchase something!')
        .addStringOption((item) => 
            item
            .setName('item')
            .setDescription('The item you want to buy'))
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
    const user = interaction.user
    const guild = interaction.guild
    const item = interaction.options.getString('item')
    let amount = interaction.options.getInteger('amount')
    
    if (!item && !amount) { //If no arguments
        
    } else {
        amount = amount ?? 1

    }
}