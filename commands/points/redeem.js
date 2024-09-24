import { SlashCommandBuilder, EmbedBuilder } from "discord.js"
import { Config, Users } from "../../database/objects.js"
import { CheckCooldown, UpdateGachaChance } from "../../helpers.js"
import cron from 'cron'

export default {
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('Grants free points, resets every day at midnight.')
        .addSubcommand((daily) => (
            daily
            .setName('daily')
            .setDescription('Grants free points, resets every day at midnight EST.')
        ))
        .addSubcommand((weekly) => (
            weekly
            .setName('weekly')
            .setDescription('Grants more free points, resets every sunday at midnight EST.')
        )),
    async execute(interaction) {
        try {
            const command = interaction.options.getSubcommand()
            if (command === 'daily') {
                var response = await daily(interaction)
            } else if (command === 'weekly') {
                var response = await weekly(interaction)
            } else {
                var response = 'Invalid subcommand'
            }
            await interaction.reply(response)
        } catch (e) {
            await interaction.reply(e)
            console.error(e)
        }
        
    },
}

async function daily(interaction) {
    try {
        const cooldown = await CheckCooldown('daily', interaction)
        const config = await Config.getConfig(interaction.guild.id)
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
        if (!cooldown) {
            await Users.updateBalance(interaction.user.id, interaction.guild.id, config.dailyPoints)
            embed.setTitle(`:white_check_mark: Daily points redeemed! :white_check_mark:`)
                 .setDescription(`\`${config.dailyPoints} PP\` added to balance`)

        } else {
            embed.setTitle(`:x: Daily points on cooldown :x:`)
                 .setDescription(`Resets at <t:${Date.parse(cron.sendAt('0 0 0 * * *')) / 1000}:t>`)
        }
        return { embeds: [embed] }
    } catch (e) {
        console.error(e)
        return e
    }
}

async function weekly(interaction) {
    try {
        const cooldown = await CheckCooldown('weekly', interaction)
        const config = await Config.getConfig(interaction.guild.id)
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
        if (!cooldown) {
            await Users.updateBalance(interaction.user.id, interaction.guild.id, config.weeklyPoints)
            embed.setTitle(`:white_check_mark: Weekly points redeemed! :white_check_mark:`)
                 .setDescription(`\`${config.weeklyPoints} PP\` added to balance`)

        } else {
            embed.setTitle(`:x: Weekly points on cooldown :x:`)
                 .setDescription(`Resets on <t:${Date.parse(cron.sendAt('0 0 0 * * 0')) / 1000}:f>`) 
        }
        return { embeds: [embed] }
    } catch (e) {
        console.error(e)
        return e
    }
}