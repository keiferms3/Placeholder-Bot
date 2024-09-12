import { ConfigModel } from "../database.js";

const ConfigObj = ConfigModel

ConfigObj.addGuild = async function (guild) {
    try {
        return await ConfigObj.create({ guildId: guild.id })
    } catch (e) {
        return e
    }
}

ConfigObj.updateConfig = async function (gid, option, value) {
    try {
        return await ConfigObj.update({ [option]: value }, {where: { guildId: gid }})
    } catch (e) {
        return e
    }
}

ConfigObj.getConfig = async function (gid, option = '') {
    try {
        const config = await ConfigObj.findOne({ where: { guildId: gid }})

        //If there's no option, send entire object
        //If there's a valid option, return that value
        //Returns null when passed an invalid object
        if (option === '') {
            return config
        } else if (Object.hasOwn(config.dataValues, option)) {
            return config[option]
        } else {
            return null
        }
    } catch (e) {
        return e
    }
}

export { ConfigObj }