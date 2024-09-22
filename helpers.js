import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { Collection } from 'discord.js'


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
    const guilds = client.cooldowns.get(command)
		for (const guild of guilds) {
			const cooldowns = guilds.get(guild[0])
			for (const cooldown of cooldowns) {
				cooldowns.set(cooldown[0], false)
			}
		}
}

//Returns true if the command is on cooldown, and false if the command is free to be used.
export async function CheckCooldown(command, interaction) {
    const userId = interaction.user.id
    const guildId = interaction.guild.id
    const guildCooldowns = interaction.client.cooldowns.get(command)
    

    let cooldowns = guildCooldowns.get(guildId)
    if (!cooldowns) {
        guildCooldowns.set(guildId, new Collection())
        cooldowns = guildCooldowns.get(guildId)
    }

    if (!cooldowns.get(userId)) {
        cooldowns.set(userId, true)
        return false
        
    } else {
        return true
    }
}

export function random(min = 0, max) {
    min -= 1
    return Math.ceil(Math.random() * (max - min) + min)
}

export async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}