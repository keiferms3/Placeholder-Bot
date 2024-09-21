import { Events, TextInputBuilder, ActionRowBuilder, ModalBuilder, TextInputStyle } from 'discord.js'

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

	//Select Menu Submission
	else if (interaction.isStringSelectMenu()) {
		const name = interaction.customId

		//Trinket Creation Selection Menu
		// if (name === 'trinketTier') {
		// 	console.log(interaction.values[0])

		// 	const modal = new ModalBuilder()
		// 		.setCustomId(`trinketCreateT${interaction.values[0]}`)
		// 		.setTitle('Create Trinket')
		// 		.addComponents(
		// 			new ActionRowBuilder().addComponents(
		// 				new TextInputBuilder()
		// 				.setCustomId('trinketName')
		// 				.setLabel('Trinket Name')
		// 				.setStyle(TextInputStyle.Short)
		// 			),
		// 			new ActionRowBuilder().addComponents(
		// 				new TextInputBuilder()
		// 				.setCustomId('trinketEmoji')
		// 				.setLabel('Trinket Emoji')
		// 				.setStyle(TextInputStyle.Short)
		// 			)
		// 		)
		// 	await interaction.showModal(modal)
		// }
	}

	//Modal Submission
	else if (interaction.isModalSubmit()) {
		const name = interaction.customId
		console.log(name)
		console.log(interaction)

		//Trinket Creation Modals
		// if (name === 'trinketCreateT1' || name === 'trinketCreateT2' || name === 'trinketCreateT3') {
		// 	console.log('trinket!')
		// }
	}
	
	else { 
		console.log(interaction)
		return 
	}
	
  },
}