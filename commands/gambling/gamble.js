import { SlashCommandBuilder } from "discord.js"
import { dice } from "./dice.js"

export default {
    data: new SlashCommandBuilder()
        .setName('gamble')
        .setDescription('Tired of waiting for dailies? Time to make some real money...')
        .addSubcommand((command) => (
            command
            .setName('dice')
            .setDescription('Low stakes betting under 20 points, place bets on what number the dice will land on!')
            .addIntegerOption((int) => (
                int
                .setName('bet')
                .setDescription('The amount of points you wish to bet (MAX 20). Defaults to 20 if unspecified.')
                .setMinValue(1)
                .setMaxValue(20)
            ))
        )),
    async execute(interaction) {
        const command = interaction.options.getSubcommand()
        if (command === 'dice') {
            await dice(interaction)
        } else if (command === 'trinket') {
            await trinket(interaction)
        }
    },
}