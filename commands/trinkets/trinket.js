import { SlashCommandBuilder } from "discord.js"
import { displayGacha } from "./trinket-gacha.js"
import { create } from "./create.js"
import { view } from "./view.js"
import { trinketReturn } from "./return.js"
import { list } from "./list.js"

export default {
    data: new SlashCommandBuilder()
        .setName('trinket')
        .setDescription('Tests a basic command!')
        //Trinket view command
        .addSubcommand((view) => (
            view
            .setName('view')
            .setDescription('View a specific trinket by ID')
            .addIntegerOption((int) => (
                int
                .setName('id')
                .setDescription('Trinket\'s unique ID number')
                .setRequired(true)
            ))
            .addBooleanOption((visible) => (
                visible
                .setName('hidden'))
                .setDescription('If true, command\'s output will not be visible to others. Allows viewing your own hidden trinkets'))
        ))
        //Trinket search by name command
        .addSubcommand((search) => (
            search
            .setName('search')
            .setDescription('View a specific trinket by name')
            .addStringOption((name) => (
                name
                .setName('name')
                .setDescription('Name of the trinket to view')
                .setRequired(true)
                .setAutocomplete(true)
            ))
            .addBooleanOption((visible) => (
                visible
                .setName('hidden'))
                .setDescription('If true, command\'s output will not be visible to others'))
        ))
        //Trinket gacha roll command
        .addSubcommand((roll) => (
            roll
            .setName('roll')
            .setDescription('Roll for trinkets!')
            .addBooleanOption((visible) => (
                visible
                .setName('hidden'))
                .setDescription('If true, command\'s output will not be visible to others'))
        ))
        //Trinket return subcommand
        .addSubcommand((scrap) => (
            scrap
            .setName('return')
            .setDescription('Return a trinket to the gacha for most of its creation value')
            .addIntegerOption((int) => (
                int
                .setName('id')
                .setDescription('Trinket\'s unique ID number')
                .setRequired(true)
            ))
        ))
        //Trinket list command
        .addSubcommand((list) => (
            list
            .setName('list')
            .setDescription('View a list of all trinkets')
            .addIntegerOption((int) => (
                int
                .setName('page')
                .setDescription('Jump to a certain page (25 trinkets per page)')
            ))
            .addUserOption((user) => (
                user
                .setName('createdby')
                .setDescription('Filter trinkets by creator')
            ))
            .addUserOption((user) => (
                user
                .setName('ownedby')
                .setDescription('Filter trinkets by owner')
            ))
            .addIntegerOption((int) => (
                int
                .setName('rarity')
                .setDescription('Filter trinkets by rarity')
                .addChoices([{name: 'Common', value: 1}, {name: 'Rare', value: 2}, {name: 'Legendary', value: 3}])
            ))
            .addBooleanOption((visible) => (
                visible
                .setName('hidden'))
                .setDescription('If true, command\'s output will not be visible to others'))
        ))
        //Trinket creation command
        .addSubcommand((create) => (
            create
            .setName('create')
            .setDescription('Create a new trinket! Costs Placeholder Points to use, type /shop to view this server\'s prices!')
            .addIntegerOption((int) => (
                int
                .setName('rarity')
                .setDescription('The trinket\'s rarity, affects cost. Command choice names are not affected by config.')
                .setRequired(true)
                .addChoices([{name: 'Common', value: 1}, {name: 'Rare', value: 2}, {name: 'Legendary', value: 3}])
            ))
            .addStringOption((string) => (
                string
                .setName('name')
                .setDescription('The trinket\'s name, 64 character limit')
                .setRequired(true)
                .setMaxLength(64)
            ))
            .addStringOption((string) => (
                string
                .setName('emoji')
                .setDescription('The trinket\'s emoji icon, must be from this server and non-animated')
                .setRequired(true)
                .setMaxLength(64)
            ))
            .addStringOption((string) => (
                string
                .setName('image')
                .setDescription('URL of the trinket\'s image, 512 character limit')
                .setRequired(false)
                .setMaxLength(512)
            ))
            .addStringOption((string) => (
                string
                .setName('description')
                .setDescription('The trinket\'s item description, 1200 character limit')
                .setRequired(false)
                .setMaxLength(1200)
            ))
            .addBooleanOption((visible) => (
                visible
                .setName('hidden'))
                .setDescription('If true, trinket will not be visible to others until rolled'))
        )),
    async execute(interaction) {
        try {
            const command = interaction.options.getSubcommand()
            if (command === 'create') {
                var response = await create(interaction)
            } 
            else if (command === 'roll') {
                var response = await displayGacha(interaction)
            } 
            else if (command === 'view') {
                var response = await view(interaction)
            } 
            else if (command === 'search') { //doesn't exist yet!! I keep it here as a placeholder to motivate me to maybe do it some day, shouldn't even be hard lmao
                var response = {content: 'This command\'s not implemented yet. You can use it because I tricked myself into thinking I\'d make it soon'}
                //var response = await search(interaction) 
            } 
            else if (command === 'return') {
                await trinketReturn(interaction)
                return
            } else if (command === 'list') {
                await list(interaction)
                return
            }
            else {
                var response = `Tinket command "\`${command}\`" not found`
            }

            await interaction.reply(response)

        } catch (e) {
            console.error(e)
        }
    },
}
