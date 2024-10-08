import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js"
import { EventEmitter } from 'node:events'
import { Config } from "../../database/objects.js"
import { UpdateGachaChance } from "../../helpers.js"

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

//Update to use embeds and look good later, add subcommands to fix permissions too
async function config(interaction) {
    try {
        const option = interaction.options.getString('option')
        const value = interaction.options.getString('value')
        //If no option, retrieve entire config
        if (!option) {
            const config = await Config.getConfig(interaction.guild.id)
            let response = '----- Config -----\n'
            for (const key in config.dataValues) {
                if (key === 'guildId') continue
                response += `\`${key}: ${config.dataValues[key]}\`\n`
            }
            return response
        }
        //If no value, retrieve option's value
        if (!value) {
            const value = await Config.getConfig(interaction.guild.id, option)
            if (value) {
                return `\`${option}: ${value}\``
            } else {
                return `Option "\`${option}\`" doesn't exist`
            }
            
        }
        //If both, update the option to the value
        const update = await Config.updateConfig(interaction.guildId, option, value)
        if (update[0] !== 0) {
            UpdateGachaChance(1, interaction)
            UpdateGachaChance(2, interaction)
            UpdateGachaChance(3, interaction)
            return `\`${option}\` successfully updated to \`${value}\``
        } else {
            return `Option "\`${option}\`" doesn't exist`
        }
        
    } catch (e) {
        console.error(e)
        return e
    }
    
}