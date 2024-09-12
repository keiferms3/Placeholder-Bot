import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js"
import { Config } from "../database/objects.js"

export default {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configuration!')
        .addStringOption((option) => 
            option
            .setName('option')
            .setDescription('The config option to change/view'))
        .addStringOption((value) => 
            value
            .setName('value')
            .setDescription('The desired value for the option, leave blank to view option'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        try {
            const response = await config(interaction)
            await interaction.reply(response)
        } catch (e) {
            console.error(e)
            await interaction.reply(e)
        }
    },
}

async function config(interaction) {
    try {
        const option = interaction.options.getString('option')
        const value = interaction.options.getString('value')
        if (!option) {
            const config = await Config.getOptions(interaction.guild.id)
            let response = '----- Config -----\n'
            for (const key in config.dataValues) {
                if (key === 'guildId') continue
                response += `\`${key}: ${config.dataValues[key]}\`\n`
            }
            return response
        }
        if (!value) {
            const value = await Config.getOptions(interaction.guild.id, option)
            if (value) {
                return `\`${option}: ${value}\``
            } else {
                return `Option "\`${option}\`" doesn't exist`
            }
            
        }
        const update = await Config.updateOption(interaction.guildId, option, value)
        if (update[0] !== 0) {
            return `\`${option}\` successfully updated to \`${value}\``
        } else {
            return `Option "\`${option}\`" doesn't exist`
        }
        
    } catch (e) {
        return e
    }
    
}