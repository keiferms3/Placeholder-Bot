import { Sequelize } from 'sequelize'
import path from 'path'
import fs from 'fs'

//Start Database
const database = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite'
})

const UsersModel = ((await import('file://C:/Users/Keifer/Desktop/Programming/Placeholder-Bot/database/models/users.js')).default)(database, Sequelize.DataTypes)

database.sync().then(async () => {
	const users = [
		UsersModel.upsert({ username: 'Bill', points: 10 }),
	]

	await Promise.all(users)
	console.log("Done!")

	database.close()
}).catch(console.error)