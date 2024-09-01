import 'dotenv/config'
import { Client, Events, GatewayIntentBits, Collection } from 'discord.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

//Start client
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`)
})

//Parse commands from commands folder
client.commands = new Collection()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const foldersPath = path.join(__dirname, 'commands')
const commandFolders = fs.readdirSync(foldersPath)

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder)
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
	for (const file of commandFiles) {
		const filePath = path.join('file://', commandsPath, file)
		const command = (await import(filePath)).command
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command)
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
		}
	}
}

//Handle command interactions
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return

	const command = interaction.client.commands.get(interaction.commandName)

	if (!command) {
		console.error(`Command ${interaction.commandName} was not found.`)
		return
	}

	try {
		await command.execute(interaction)
	} catch (error) {
		console.error(error)
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: `Error while executing command ${interaction.commandName}!`, ephemeral: true })
		} else {
			await interaction.reply({ content: `Error while executing command ${interaction.commandName}!`, ephemeral: true })
		}
	}
})

//Login with token
client.login(process.env.DISCORD_TOKEN)