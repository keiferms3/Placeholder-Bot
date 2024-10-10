import { TrinketsModel } from "../database.js";
import { Config } from "../objects.js"

const TrinketsObj = TrinketsModel

//Creates a new trinket, adding it to the appropriate gacha category
TrinketsObj.addTrinket = async function (tier, name, emoji, image, description, creatorId, guildId, hidden, interaction) {
    try {
        if (!hidden) hidden = false
        const ownerId = `gacha${tier}`
        const trinkets = await TrinketsObj.getTrinkets(undefined, interaction.guildId)
        return await TrinketsObj.create({ 
            trinketId: trinkets.length + 1,
            tier: tier, 
            name: name, 
            emoji: emoji, 
            image: image, 
            description: description, 
            ownerId: ownerId, 
            creatorId: creatorId, 
            guildId: guildId, 
            hidden: hidden 
        })
    } catch (e) {
        console.error(e)
        return e
    }
}

//Retrieve trinket(s) by IDs provided
TrinketsObj.getTrinkets = async function (id = undefined, guildId = undefined, ownerId = undefined, creatorId = undefined) {
    try {
        //gross function... smelly function.... most of these model object functions are kinda stinky ngl
        if (id) {
            return await TrinketsObj.findOne({ where: {trinketId: id}})
        } else if (ownerId && guildId) {
            return await TrinketsObj.findAll({ where: {ownerId: ownerId, guildId: guildId} })
        } else if (creatorId && guildId) {
            return await TrinketsObj.findAll({ where: {creatorId: creatorId, guildId: guildId} })
        } else if (guildId) {
            return await TrinketsObj.findAll({ where: {guildId: guildId} })
        } else {
            return await TrinketsObj.findAll()
        }
        
    } catch (e) {
        console.error(e)
        return e
    }
}

export { TrinketsObj }