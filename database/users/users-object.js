import { UsersModel } from "../database.js"
import { Config } from "../objects.js"

const UsersObj = UsersModel

UsersObj.updateBalance = async function (uid, gid, pointVal) {
    try {
        pointVal = Math.floor(pointVal)
        const user = await UsersObj.findOne({ where: { userId: uid, guildId: gid }})
        let pointBal = user.points + pointVal
        let pointDifference = pointVal

        const config = await Config.getConfig(gid)
        //Currently this is the only way maxPoints is enforced anywhere LMAO, TODO later cull balances when updating config
        if (config.maxPoints > -1) {
            if (pointBal > config.maxPoints) {
                pointDifference -= pointBal - config.maxPoints
                pointBal = config.maxPoints
            }
        }
        user.points = pointBal
        await user.save()
        return pointDifference
        
    } catch (e) {
        console.error(e)
        return e
    }
}


UsersObj.getBalance = async function (uid, gid) {
    try {
        const user = await UsersObj.findOne({ where: { userId: uid, guildId: gid}})
        return user.points 
    } catch (e) {
        return e
    }
}

UsersObj.addUser = async function (uid, gid) {
    try {
        return await UsersObj.create({ userId: uid, guildId: gid })
    } catch (e) {
        return e
    }
}

UsersObj.getUser = async function (uid = null, gid = null) {
    try {
        //Return one entry with both IDs, or findall with one ID (all users in a server, or all examples of a user between servers)
        if (uid && gid) {
            return await UsersObj.findOne({ where: { userId: uid, guildId: gid}})
        } else if (gid) {
            return await UsersObj.findAll({ where: { guildId: gid}})
        } else if (uid) {
            //Not sure why you would need this
            return await UsersObj.findAll({ where: { userId: uid}})
        } else {
            //This also shouldn't ever be used
            return null
        }
        
    } catch (e) {
        return e
    }
}

UsersObj.getUserById = async function (id) {
    try {
        return await UsersObj.findOne({ where: { id: id}})
    } catch (e) {
        return e
    }
}

export { UsersObj }