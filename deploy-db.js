import { Sequelize } from 'sequelize'
import { fileURLToPath } from 'url'
import { Collection } from 'discord.js'
import path from 'path'
import fs from 'fs'

//Start Database
const database = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite'
})

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const modelsPath = path.join(__dirname, 'database/models')
const modelFiles = fs.readdirSync(modelsPath)

const models = new Collection()
for (const file of modelFiles) {
	const filePath = path.join('file://', modelsPath, file)
	const model = (await import(filePath)).default(database, Sequelize.DataTypes)
	models.set(file, model)
}

database.sync().then(async () => {
	const users = [
		models.get('users.js').upsert({ username: 'Bill', points: 10 }),
	]
	await Promise.all(users)
	
	console.log("Database deployed!")
	database.close()
}).catch(console.error)