import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { Collection } from 'discord.js'
import { Config, Trinkets, Users } from './database/objects.js'
import { setTimeout } from 'timers/promises'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js"


export async function IterateFolder(dir, filter, func) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const folderPath = path.join(__dirname, dir)
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith(filter))
    const func_returns = new Collection()

    for (const file of files) {
        const fullPath = path.join('file://', folderPath, file)
        const kv = await func(file, fullPath) ?? {key: '', value: ''}
        func_returns.set(kv.key, kv.value)
    }
    return func_returns
}

export async function IterateFolders(dir, filter, func) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const rootFolderPath = path.join(__dirname, dir)
    const folders = fs.readdirSync(rootFolderPath).filter(file => !(file.endsWith('.js')))
    const func_returns = new Collection()

    for (const folder of folders) {
        const folderPath = path.join(rootFolderPath, folder)
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith(filter))

        for (const file of files) {
            const fullPath = path.join('file://', folderPath, file)
            const kv = await func(file, fullPath) ?? {key: '', value: ''}
            func_returns.set(kv.key, kv.value)
        }
    }
    return func_returns
}

export async function ResetCooldown(command, client) {
    const guilds = client.guilds.cache
		for (const guild of guilds) {
			const users = await Users.getUser(null, guild[0])
			for (const user of users) {
				user[`${command}Cooldown`] = false
                user.save()
			}
		}
}

//Returns true if the command is on cooldown, and false if the command is free to be used.
export async function CheckCooldown(command, interaction) {
    const userId = interaction.user.id
    const guildId = interaction.guild.id
    const user = await Users.getUser(userId, guildId)

    if (!user[`${command}Cooldown`]) {
        user[`${command}Cooldown`] = true
        user.save()
        return false
    } else {
        return true
    }
}

export function randomInt(min = 0, max) {
    min -= 1
    return Math.ceil(Math.random() * (max - min) + min)
}

export function randomFloat(min = 0, max) {
    min -= 1
    return Math.random() * ((max - min) + min)
}

export async function sleep(ms) {
    return await setTimeout(ms, 'timeout')
}

//Ensures a number is at least min, and at most max
export function clamp(number, min, max) {
    return Math.min(Math.max(number, min), max);
}

export async function InitGachaChances(client) {
    for (const guild of client.guilds.cache) {
        const config = await Config.getConfig(guild[0])
        if (!config) { continue }

        client.gachaChances.set(guild[0], new Collection())
        const t1Trinkets = await Trinkets.getTrinkets(undefined, guild[0], 'gacha1')
        const t2Trinkets = await Trinkets.getTrinkets(undefined, guild[0], 'gacha2')
        const t3Trinkets = await Trinkets.getTrinkets(undefined, guild[0], 'gacha3')
        client.gachaChances.get(guild[0]).set(1, clamp(config.minChanceT1 + ((t1Trinkets.length ?? 0) * config.perChanceT1), config.minChanceT1, config.maxChanceT1)) //Set to number of tier trinkets * perChance to a max of maxChance
        client.gachaChances.get(guild[0]).set(2, clamp(config.minChanceT2 + ((t2Trinkets.length ?? 0) * config.perChanceT2), config.minChanceT2, config.maxChanceT2))
        client.gachaChances.get(guild[0]).set(3, clamp(config.minChanceT3 + ((t3Trinkets.length ?? 0) * config.perChanceT3), config.minChanceT3, config.maxChanceT3))
    }
}

//Called when a trinket is added/removed from the gacha
export async function UpdateGachaChance(tier, interaction) {
    const guildId = interaction.guild.id
    const config = await Config.getConfig(guildId)
    const gachaChances = interaction.client.gachaChances.get(guildId)
    const trinkets = await Trinkets.getTrinkets(undefined, guildId, `gacha${tier}`)

    //Chance is min chance + length * perchance, clamp to min and max values
    const chance = clamp(config[`minChanceT${tier}`] + (trinkets.length * config[`perChanceT${tier}`]), config[`minChanceT${tier}`], config[`maxChanceT${tier}`])
    gachaChances.set(tier, chance)
}


//Modified handleLeaderboard function (from leaderboard.js)
export async function handlePages(title, pages, interaction) {

    const config = await Config.getConfig(interaction.guild.id)
    const ephemeral = interaction.options.getBoolean('hidden')

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(title)
    const components = new ActionRowBuilder()
        .setComponents(
            new ButtonBuilder()
                .setCustomId('leaderboardBack')
                .setLabel('◀ Previous Page')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('leaderboardForward')
                .setLabel('Next Page ▶')
                .setStyle(ButtonStyle.Secondary),
        )

    const maxPages = pages.length
    let firstPage = true
    let pageNum = 1
    const timeout = setTimeout(600_000, 'timeout')
    
    while (true) {
        //Render page
        let desc = ''
        embed.setDescription(pages[pageNum-1])
             .setFooter({text: `Page ${pageNum} / ${maxPages}`})
        
        //Reply if first page, otherwise edit
        if (firstPage) { 
            var reply = await interaction.reply({embeds: [embed], components: [components], ephemeral: ephemeral})
            firstPage = false 
        }
        else { await reply.edit({embeds: [embed]}) }

        //Await buttons or timeout
        const awaitButton = reply.awaitMessageComponent()
        const button = await Promise.any([awaitButton, timeout])

        //Check if timeout triggered
        if (button === 'timeout') {
            reply.edit({embeds: [embed], components: []})
            return
        }

        //If button recieved, determine which button was pressed
        if (button.customId === 'leaderboardForward') {
            (pageNum < maxPages) ? pageNum += 1 : pageNum = 1
        } else if (button.customId === 'leaderboardBack') {
            (pageNum > 1) ? pageNum -= 1 : pageNum = maxPages
        } else {
            reply.edit({embeds: [], content: 'Error: Invalid button ID recieved'})
            return
        }
        button.deferUpdate()
    }
}