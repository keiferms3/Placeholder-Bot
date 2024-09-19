import { EmbedBuilder, SlashCommandBuilder } from "discord.js"
import { Config } from "../../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('trinket')
        .setDescription('Tests a basic command!')
        .addSubcommand((view) => (
            view
            .setName('view')
            .setDescription('View a specific trinket')
        ))
        .addSubcommand((create) => (
            create
            .setName('create')
            .setDescription('Create a new trinket!')
        )),
    async execute(interaction) {
        const guildId = interaction.guild.id
        const userId = interaction.user.id

        const config = Config.getConfig(guildId)
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)

        const command = interaction.options.getSubcommand()

        if (command === 'create') {
            const test = create(interaction, config)
        } else if (command === 'view') {
            const test = view(interaction, config)
        } else {
            embed.setTitle(`Command "\`${command}\`" not found`)
        }

        return {embeds: [embed]}
    },
}

async function create(interaction, config) {
    
}

async function view(interaction, config) {

}