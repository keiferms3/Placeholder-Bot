import { SlashCommandBuilder } from "discord.js"
import { Users } from "../../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check someone\'s point balance')
        .addUserOption((user) => 
            user    
            .setName('user')
            .setDescription('The user who\'s balance you wish to view')),
    async execute(interaction) {
        const response = await balance(interaction)
        await interaction.reply(response)
    },
}

async function balance(interaction) {
    try {
        const user = interaction.options.getUser('user') ?? interaction.user
        const balance = await Users.getBalance(user.id, interaction.guild.id)
        if (balance == undefined) {
            return `Balance not found for user "${user.globalName}"`
        }
        return `----- ${user.globalName}'s Balance -----\n:coin:  \` Placeholder Points | ${balance} PP \`  :coin:`
    } catch (e) {
        console.error(e)
        return e
    }
}