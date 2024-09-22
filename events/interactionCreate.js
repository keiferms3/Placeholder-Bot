import { Events, TextInputBuilder, ActionRowBuilder, ModalBuilder, TextInputStyle } from 'discord.js'
import { rollGacha } from '../commands/trinkets/gacha.js'

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
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: `Error while executing command ${interaction.commandName}!`, ephemeral: true })
			} else {
				await interaction.reply({ content: `Different error while executing command ${interaction.commandName}!`, ephemeral: true })
			}
		}
	}

	//Button presses
	else if (interaction.isButton()) {
		const button = interaction.customId
		
		//On gacha roll
		if (button === 'gachaRoll') {
			await rollGacha(interaction)
		}
	}

	//Select Menu Submission
	// else if (interaction.isStringSelectMenu()) {
	// 	const name = interaction.customId
	// }

	//Modal Submission
	// else if (interaction.isModalSubmit()) {
	// 	const name = interaction.customId
	// }
	
	else { 
		//console.log(interaction)
		console.log('wuh')
		return 
	}
	
  },
}