import { Sequelize } from 'sequelize'
import { IterateFolders } from '../helpers.js'

//Start Database
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
	omitNull: true,
})

//Load all models into database and store in collection
const models = await IterateFolders('database', '-model.js', async (file, fullPath) => { 
	return { key: file, value: (await import(fullPath)).default(sequelize, Sequelize.DataTypes) }
})

//Pull out models for exporting
export const UsersModel = models.get('users-model.js')
export const ArtifactsModel = models.get('artifacts-model.js')
export const ConfigModel = models.get('config-model.js')

//Sync db
const force = process.argv.includes('--force') || process.argv.includes('-f');
sequelize.sync({force}).then(async () => {
	//populate db with data
	const data = [
		//UsersModel.upsert({ username: 'Bill', userId: '120939101', guildId: '1232131231' points: 5, gifts: 10 }),
	]
	await Promise.all(data)
	
	console.log("Database deployed!")
}).catch(console.error)
