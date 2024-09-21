import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { Config, Users } from "../../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View where you can spend your points'),
    async execute(interaction) {
        const response = await shop(interaction)
        await interaction.reply(response)
    },
}

async function shop(interaction) {
    try {
        const config = await Config.getConfig(interaction.guild.id)
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('💰 Shop List 💰')
            .addFields({
                name: '🏆 Trinkets 🏆',
                value: `\`Create T1\` \`${config.trinketT1Cost} PP\`\n\`Create T2\` \`${config.trinketT2Cost} PP\`\n\`Create T3\` \`${config.trinketT3Cost} PP\``,
              }, {
                name: '✉️ Messages ✉️',
                value: `\`Add to 8 Ball\` \`100 PP\`\n\`Randomly send on command\` \`200 PP\`\n\`Randomly replace command\` \`1000 PP\``,
              })

        return { embeds: [embed] }
    } catch (e) {
        console.error(e)
        return e
    }
    
}