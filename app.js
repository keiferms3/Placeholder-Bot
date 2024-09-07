import 'dotenv/config'
import { Client, Events, GatewayIntentBits, Collection } from 'discord.js'
import { Sequelize } from 'sequelize'
import { IterateFolder } from './helpers.js'

//Start client
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`)
})

//Parse commands from commands folder
client.commands = await IterateFolder('commands', '.js', async (file, filePath) => {
	const command = (await import(filePath)).default
	if ('data' in command && 'execute' in command) {
		return {key: command.data.name, value: command}
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
	}
})

//Event handling
IterateFolder('events', '.js', async (file, filePath) => {
	const event = (await import (filePath)).default
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args))
	} else {
		client.on(event.name, (...args) => event.execute(...args))
	}
})


//Login with token
client.login(process.env.DISCORD_TOKEN)