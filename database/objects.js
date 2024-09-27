import { UsersObj } from "./users/users-object.js"
import { ConfigObj } from "./config/config-object.js"
import { TrinketsObj } from "./trinkets/trinkets-object.js"

export const Users = UsersObj
export const Config = ConfigObj
export const Trinkets = TrinketsObj

export class Trade {
    constructor(reply, uid1, uid2, gid) {
        this.reply = reply //Stores a reference to the message with the trade window
        this.userId1 = uid1
        this.userId2 = uid2
        this.guildId = gid
        this.items1 = []
        this.items2 = []
        this.points1 = 0
        this.points2 = 0
        this.ready1 = false
        this.ready2 = false
        this.completeButton = false
    }
}