import { REST, Routes } from 'discord.js'
import 'dotenv/config'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'


const commands = []

//Get command folders
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const foldersPath = path.join(__dirname, 'commands')
const commandFolders = fs.readdirSync(foldersPath)

for (const folder of commandFolders) {
	// Get files from folders
	const commandsPath = path.join(foldersPath, folder)
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))

	for (const file of commandFiles) {
		const filePath = path.join('file://', commandsPath, file)
    console.log(filePath)
		const command = (await import(filePath))
    console.log(command)
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON())
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
		}
	}
}

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
