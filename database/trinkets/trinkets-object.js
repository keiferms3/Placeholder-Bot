import { TrinketsModel } from "../database.js";
import { Config } from "../objects.js"

const TrinketsObj = TrinketsModel

//Creates a new trinket, adding it to the appropriate gacha category
TrinketsObj.addTrinket = async function (tier, name, emoji, image, description, creatorId, guildId) {
    try {
        const ownerId = `gacha${tier}`
        return await TrinketsObj.create({ tier: tier, name: name, emoji: emoji, image: image, description: description, ownerId: ownerId, creatorId: creatorId, guildId: guildId }) //wow this sucks
    } catch (e) {
        console.error(e)
        return e
    }
}

//Retrieve trinket(s) by IDs provided
TrinketsObj.getTrinket = async function (id = null, ownerId = null, creatorId = null, groupId = null) {

}

export { TrinketsObj }