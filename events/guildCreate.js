import { Events } from 'discord.js'
import { Users } from '../database/users/users-object.js'

export default {
  name: Events.GuildCreate,
  async execute(guild) {
    console.log(`Joined ${guild.name}!`)

    const users = await guild.members.fetch()
    for (const user of users) {
      await Users.createEntry(user[0], guild.id)
    }
  }
}