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