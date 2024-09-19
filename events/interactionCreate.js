import { Events } from 'discord.js'

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
	// Slash Commands
    if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName)

		if (!command) {
			console.error(`Command ${interaction.commandName} was not found.`)
			return
		}
	
		try {
			await command.execute(interaction)
		} catch (error) {
			console.error(error)
			await interaction.followUp({ content: `Error while executing command ${interaction.commandName}!`, ephemeral: true })
		}
	}
	else if (interaction.isModalSubmit()) {
		
	}
	else { return }
	
  },
}