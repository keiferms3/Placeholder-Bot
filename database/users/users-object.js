import { UsersModel } from "../database.js"
import { Config } from "../objects.js"

const UsersObj = UsersModel

UsersObj.updateBalance = async function (uid, gid, pointVal, giftVal) {
    try {
        const user = await UsersObj.findOne({ where: { userId: uid, guildId: gid }})
        let pointBal = user.points + pointVal
        let giftBal = user.gifts + giftVal
        const points = {points: pointVal, gifts: giftVal}

        const config = await Config.getOptions(gid)
        if (config.maxPoints > -1) {
            if (pointBal > config.maxPoints) {
                points.points -= pointBal - config.maxPoints
                pointBal = config.maxPoints
            }
        }
        if (config.maxGifts > -1) {
            if (giftBal > config.maxGifts) {
                points.gifts -= giftBal - config.maxGifts
                giftBal = config.maxGifts
            }
        }
        user.points = pointBal
        user.gifts = giftBal
        await user.save()
        return points
        
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

UsersObj.getBalance = async function (uid, gid) {
    try {
        const user = await UsersObj.findOne({ where: { userId: uid, guildId: gid}})
        return { points: user.points, gifts: user.gifts }
    } catch (e) {
        return e
    }
}

UsersObj.getUser = async function (uid = null, gid = null) {
    try {
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

UsersObj.getById = async function (id) {
    try {
        return await UsersObj.findOne({ where: { id: id}})
    } catch (e) {
        return e
    }
}

export { UsersObj }