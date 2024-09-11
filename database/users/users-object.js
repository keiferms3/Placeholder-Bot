import { UsersModel } from "../database.js"

const UsersObj = UsersModel

UsersObj.updateBalance = async function (uid, gid, pointval, giftval) {
    try {
        return await UsersObj.increment({ points: pointval, gifts: giftval }, { where: { userId: uid, guildId: gid }})
    } catch (e) {
        return e
    }
}

UsersObj.createEntry = async function (uid, gid) {
    try {
        return await UsersObj.create({ userId: uid, guildId: gid })
    } catch (e) {
        return e
    }
}

export { UsersObj }