import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js"
import { Config, Users } from "../../database/objects.js"
import { setTimeout } from 'timers/promises'
import { clamp, randomInt, sleep } from "../../helpers.js"

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

async function dice(interaction) {
    let bet = interaction.options.getInteger('bet') ?? 20
    const config = await Config.getConfig(interaction.guild.id)
    const faceNames = config.gamblingDiceNames.split(',')
    const user = await Users.getUser(interaction.user.id, interaction.guild.id)

    //Initialize relevant info
    const selectedButtons = [false, false, false, false, false, false]
    let numSelected = 0
    let chance = numSelected / 6
    let multiplier = (numSelected > 0) ? (6 / numSelected) : 1

    //Initialize buttons and embed
    let diceRow1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('dice#1').setLabel(faceNames[0]).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('dice#2').setLabel(faceNames[1]).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('dice#3').setLabel(faceNames[2]).setStyle(ButtonStyle.Secondary),
        )
    let diceRow2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('dice#4').setLabel(faceNames[3]).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('dice#5').setLabel(faceNames[4]).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('dice#6').setLabel(faceNames[5]).setStyle(ButtonStyle.Secondary),      
        )
    const gambleRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('diceRoll').setLabel(`Roll!`).setEmoji('🎲').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('diceBet').setLabel(`Change Bet`).setEmoji('🪙').setStyle(ButtonStyle.Success),
        )
    
    let menuEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`:game_die: Dice Betting :game_die:`)
        .setDescription(`:coin: Current Bet: \` ${bet} PP \`\n:slot_machine: Payout Chance: \` ${(chance * 100).toFixed(2)}% \`\n:money_with_wings: Reward Multiplier: \` ${multiplier}x \` = \` ${Math.floor(bet * multiplier)} PP \``)

    let menuReply = await interaction.reply({embeds: [menuEmbed], components: [diceRow1, diceRow2, gambleRow]})
    const timeout = setTimeout(600_000, 'timeout')
    while (true) {
        //Await buttons or timeout
        const awaitButton = menuReply.awaitMessageComponent()
        const button = await Promise.any([awaitButton, timeout])
        if (button === 'timeout') { 
            await menuReply.edit({components: []})
            return 
        }
        if (button.user.id !== interaction.user.id) { button.reply({content: 'excuse me im going to have to ask you to leave the casino', ephemeral: true}) ; continue}

        const num = parseInt(button.customId.substring(button.customId.length - 1))

        //********** If betting number pressed ********** 
        if (button.customId.startsWith('dice#')) {
            //Handle visual button selection
            const i = ((num - 1) % 3) //Index of the button within an actionrow
            const oldButton = button.message.components[Math.ceil(num / 3) - 1].components[i]

            const newButton = new ButtonBuilder()
                .setLabel(oldButton.label)
                .setCustomId(oldButton.customId)
                .setStyle(oldButton.style === ButtonStyle.Secondary ? ButtonStyle.Primary : ButtonStyle.Secondary)
        
            if (num < 4) { diceRow1.components[i] = newButton }
            else { diceRow2.components[i] = newButton }

            //Update game info
            selectedButtons[num - 1] = (newButton.data.style === ButtonStyle.Primary)
            numSelected += (newButton.data.style === ButtonStyle.Primary) ? 1 : -1
            chance = numSelected / 6
            multiplier = (numSelected > 0) ? (6 / numSelected) : 1

            menuEmbed.setDescription(`:coin: Current Bet: \` ${bet} PP \`\n:slot_machine: Payout Chance: \` ${(chance * 100).toFixed(2)}% \`\n:money_with_wings: Reward Multiplier: \` ${multiplier}x \` = \` ${Math.floor(bet * multiplier)} PP \``)
            
            menuReply = await menuReply.edit({embeds: [menuEmbed], components: [diceRow1, diceRow2, gambleRow]})
            button.deferUpdate()
        }
        
        //********** If roll button pressed **********
        else if (button.customId === 'diceRoll') {
            //Declare inline function so can be asynchronously run
            const handleDiceRoll = async () => {
                //Abort if no bets placed
                if (numSelected < 1) {
                    let embed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setDescription('You must place a bet before you can roll')
                    await button.reply({embeds: [embed], ephemeral: true})
                    return
                }

                //Make copies of relevant values so they aren't changed while async roll is performed
                const selected = [...selectedButtons] 
                const realBet = bet

                let selectedString = ''
                selected.forEach((b, i) => {
                    if (b) {
                        selectedString += `${faceNames[i]}, `
                    }
                })
                selectedString = selectedString.slice(0, -2)
            
                let rollEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`:game_die: ${faceNames[randomInt(0, 5)]}`)
                    .setDescription(`${interaction.user.displayName} is betting on \`${selectedString}\``)
                const rollReply = await button.reply({embeds: [rollEmbed]})
            
                //Immediately deduct roll
                if (user.points < realBet) {
                    rollEmbed.setTitle(`:x: Roll failed :x:`)
                        .setDescription(`Not enough points. Roll requires \`${realBet} PP\`, you have \`${user.points} PP\``)
                    await rollReply.edit({embeds: [rollEmbed]})
                    return
                }
                await Users.updateBalance(user.userId, interaction.guild.id, -1*realBet)
            
                //Start async cosmetic rolling
                const animate = async () => {
                    let dots = ''
                    let lastRand = 6 //No last rand
                    let rand = 0
                    for (let i = 0; i < 6; i++) {
                        dots += '.'
                    
                        //Cycle through possible rolls
                        do { rand = randomInt(0, 5) } 
                        while ( rand === lastRand )
                        lastRand = rand

                        rollEmbed.setTitle(`:game_die: ${faceNames[rand]}`)
                                 .setDescription(`${interaction.user.displayName} is betting on \`${selectedString}\`${dots}`)

                        await rollReply.edit({embeds: [rollEmbed]})
                        await sleep(200)
                    }
                    return
                } 
                const animationDone = animate()
            
                //Actually handle roll
                const result = randomInt(0, 5)
                const resultName = faceNames[result]
            
                await animationDone //Finish animation before displaying results
            
                //Determine if selected value was rolled and handle results
                if (selected[result]) {
                    await Users.updateBalance(user.userId, interaction.guild.id, Math.floor(realBet * multiplier))
                    rollEmbed.setTitle(`:white_check_mark: ${resultName}`)
                        .setDescription(`:tada: ${interaction.user.displayName} won! \`${Math.floor(realBet * multiplier)} PP\` added to balance!`)
                    await rollReply.edit({embeds: [rollEmbed]})
                } else {
                    rollEmbed.setTitle(`:x: ${resultName}`)
                        .setDescription(`:pensive: ${interaction.user.displayName} lost... Better luck next time!`)
                    await rollReply.edit({embeds: [rollEmbed]})
                }       
            }
            handleDiceRoll() //Actually run the function
        }

        //********** If change bet button pressed ********** 
        else if (button.customId === 'diceBet') {
            const modal = new ModalBuilder()
                .setCustomId('diceBetModal')
                .setTitle('Change bet!')
                .addComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            new TextInputBuilder()
                                .setCustomId('diceBetInput')
                                .setLabel('Enter a new bet between 1 and 20')
                                .setStyle(TextInputStyle.Short)
                                .setMinLength(1)
                                .setMaxLength(2)
                        )
                )
                button.showModal(modal)
                const modalSubmission = await button.awaitModalSubmit({time: 300_000})

                let newBet = parseInt(modalSubmission.fields.getTextInputValue('diceBetInput'))
                if (isNaN(newBet)) { newBet = 1 }
                bet = clamp(newBet, 1, 20)

                const modalEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setDescription(`Bet successfully updated to \`${bet}\``)
                menuEmbed.setDescription(`:coin: Current Bet: \` ${bet} PP \`\n:slot_machine: Payout Chance: \` ${(chance * 100).toFixed(2)}% \`\n:money_with_wings: Reward Multiplier: \` ${multiplier}x \` = \` ${Math.floor(bet * multiplier)} PP \``)

                menuReply = await menuReply.edit({embeds: [menuEmbed]})
                modalSubmission.reply({embeds: [modalEmbed], ephemeral: true})
        }

        else {
            await rollReply.edit({content: 'invalid button how\'d this happen??'})
        }
    }
}

//Function only pulled out so it can be run asynchonously. Yes I should make an object for those parameters but as usual, lazy :(
async function handleDiceRoll(selected, faceNames, bet, multiplier, button, interaction) {
    //Declarations
    const user = await Users.getUser(interaction.user.id, interaction.guild.id)
    const config = await Config.getConfig(interaction.guild.id)

    const selectedButtons = [...selected] //Done so the user can't change their bets while roll is ongoing

    let selectedString = ''
    selectedButtons.forEach((b, i) => {
        if (b) {
            selectedString += `${faceNames[i]}, `
        }
    })
    selectedString = selectedString.slice(0, -2)

    let rollEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`:game_die: ${faceNames[randomInt(0, 5)]}`)
        .setDescription(`${interaction.user.displayName} is betting on \`${selectedString}\``)
    const rollReply = await button.reply({embeds: [rollEmbed]})

    //Immediately deduct roll
    if (user.points < bet) {
        rollEmbed.setTitle(`:x: Roll failed :x:`)
            .setDescription(`Not enough points. Roll requires \`${bet} PP\`, you have \`${user.points} PP\``)
        await rollReply.edit({embeds: [rollEmbed]})
        return
    }
    await Users.updateBalance(user.userId, interaction.guild.id, -1*bet)

    //Start async cosmetic rolling
    const animate = async () => {
        let dots = ''
        let lastRand = 6 //No last rand
        let rand = 0
        for (let i = 0; i < 6; i++) {
            dots += '.'

            //Cycle through possible rolls
            do { rand = randomInt(0, 5) } 
            while ( rand === lastRand )
            lastRand = rand
            
            rollEmbed.setTitle(`:game_die: ${faceNames[rand]}`)
                     .setDescription(`${interaction.user.displayName} is betting on \`${selectedString}\`${dots}`)

            await rollReply.edit({embeds: [rollEmbed]})
            await sleep(200)
        }
        return
    } 
    const animationDone = animate()

    //Actually handle roll
    const result = randomInt(0, 5)
    const resultName = faceNames[result]

    await animationDone //Finish animation before displaying results

    //Determine if selected value was rolled and handle results
    if (selectedButtons[result]) {
        await Users.updateBalance(user.userId, interaction.guild.id, Math.floor(bet * multiplier))
        rollEmbed.setTitle(`:white_check_mark: ${resultName}`)
            .setDescription(`:tada: ${interaction.user.displayName} won! \`${Math.floor(bet * multiplier)} PP\` added to balance!`)
        await rollReply.edit({embeds: [rollEmbed]})
    } else {
        rollEmbed.setTitle(`:x: ${resultName}`)
            .setDescription(`:pensive: ${interaction.user.displayName} lost... Better luck next time!`)
        await rollReply.edit({embeds: [rollEmbed]})
    }       
}