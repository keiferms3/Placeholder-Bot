import { Events } from 'discord.js'
import { Users } from '../database/objects.js'

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    Users.addUser(member.user.id, member.guild.id)
  }
}