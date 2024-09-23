import 'dotenv/config'
import { Client, Events, GatewayIntentBits, Collection } from 'discord.js'
import { InitGachaChances, IterateFolder, IterateFolders, ResetCooldown, UpdateGachaChance } from './helpers.js'
import { CronJob } from 'cron'

//Start client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] })

//Parse commands from commands folder
client.commands = await IterateFolders('commands', '.js', async (file, filePath) => {
	const command = (await import(filePath)).default
	if ('data' in command && 'execute' in command) {
		return {key: command.data.name, value: command}
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
	}
})

//Event handling
await IterateFolder('events', '.js', async (file, filePath) => {
	const event = (await import (filePath)).default
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args))
	} else {
		client.on(event.name, (...args) => event.execute(...args))
	}
})


//Startup handler
client.once(Events.ClientReady, async (readyClient) => {
	//Declare objects 
	client.cooldowns = new Collection()
	client.cooldowns.set('daily', new Collection())
	client.cooldowns.set('weekly', new Collection())

	await InitGachaChances(client)

	//Setup cronjobs
	const daily = new CronJob('00 00 00 * * *', () => {
		console.log('Reset!!!')
		ResetCooldown('daily', readyClient)
	})
	daily.start()

	const weekly = new CronJob('00 00 00 * * 0', () => {
		console.log('Weekly Reset!!!')
		ResetCooldown('weekly', readyClient)
	})
	weekly.start()

	//Print ready status
	console.log(`Online as ${readyClient.user.tag}`)
})

//Login with token
client.login(process.env.DISCORD_TOKEN)