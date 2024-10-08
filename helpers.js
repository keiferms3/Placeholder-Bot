import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { Collection } from 'discord.js'
import { Config, Trinkets, Users } from './database/objects.js'


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
    return new Promise((resolve) => setTimeout(resolve, ms))
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

export function parseEquation(str) {
    return Function(`'use strict'; return (${str})`)()
  }