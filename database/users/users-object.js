import { UsersModel } from "../database.js"

const Users = UsersModel

Users.updateBalance = async function (uid, gid, pointval, giftval) {
    try {
        return await Users.increment({ points: pointval, gifts: giftval }, { where: { userid: uid, guildid: gid}})
    } catch (e) {
        return e
    }
}

Users.createEntry = async function (uid, gid) {
    try {
        return await Users.create({ userid: uid, guildid: gid })
    } catch (e) {
        return e
    }
}

export { Users }