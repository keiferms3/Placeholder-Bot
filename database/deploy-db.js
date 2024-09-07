import { Sequelize } from 'sequelize'

import { IterateFolder } from '../helpers.js'

//Start Database
const database = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite'
})

const models = await IterateFolder('database/models', '.js', async (file, fullPath) => { 
	return { key: file, value: (await import(fullPath)).default(database, Sequelize.DataTypes) }
})

const force = process.argv.includes('--force') || process.argv.includes('-f');
database.sync({force}).then(async () => {
	const users = [
		models.get('users.js').upsert({ username: 'Bill', points: 10 }),
	]
	await Promise.all(users)
	
	console.log("Database deployed!")
	database.close()
}).catch(console.error)