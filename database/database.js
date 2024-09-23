import { Sequelize } from 'sequelize'
import { Collection } from 'discord.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

//Start Database
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
})

//Load all models into database and store in collection
const models = await IterateFolders('.', '-model.js', async (file, fullPath) => { 
	return { key: file, value: (await import(fullPath)).default(sequelize, Sequelize.DataTypes) }
})

//Pull out models for exporting
export const UsersModel = models.get('users-model.js')
export const TrinketsModel = models.get('trinkets-model.js')
export const ConfigModel = models.get('config-model.js')

//Sync db
const force = process.argv.includes('--force') || process.argv.includes('-f')
const alter = process.argv.includes('--alter') || process.argv.includes('-a')
sequelize.sync({force, alter}).then(async () => {
	//populate db with data
	const data = [
		//UsersModel.upsert({ username: 'Bill', userId: '120939101', guildId: '1232131231' points: 5 }),
	]
	await Promise.all(data)
	
	console.log("Database deployed!")
}).catch(console.error)

//Copied from helpers.js because of import conflicts
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