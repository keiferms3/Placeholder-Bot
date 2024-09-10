import { REST, Routes, Collection } from 'discord.js'
import 'dotenv/config'
import { IterateFolder } from './helpers.js'


const commandsCollection = await IterateFolder('commands', '.js', async (file, filePath) => {
	const command = (await import(filePath)).default
	if ('data' in command && 'execute' in command) {
		return {key: command.data.name, value: command.data.toJSON()}
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
	}
})
const commands = [...commandsCollection.values()]

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`)

		const data = await rest.put(
			Routes.applicationCommands(process.env.APP_ID),
			{ body: commands },
		)

		console.log(`Successfully reloaded ${data.length} application (/) commands.`)
	} catch (error) {
		console.error(error)
	}
})()
