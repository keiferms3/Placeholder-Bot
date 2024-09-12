import { Events } from 'discord.js'
import { Users, Config } from '../database/objects.js'

export default {
  name: Events.GuildCreate,
  async execute(guild) {
    console.log(`Joined ${guild.name}!`)
    const users = await guild.members.fetch()

    for (const user of users) {
      await Users.addUser(user[0], guild.id)
    }

    Config.addGuild(guild)
    
  }
}