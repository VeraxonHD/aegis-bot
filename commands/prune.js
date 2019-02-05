module.exports = {
  name: "prune",
  description: "Deletes messages in bulk",
  alias: ["purge", "bulkdelete", "delete", "del"],
  usage: "prune <mentionable user>",
  permissions: "MANAGE_MESSAGES",
  execute(message, args, prefix, client, Discord) {
    const guild = message.guild
    let messagecount = parseInt(args[0]);
  
    if (!message.member.hasPermission("MANAGE_MESSAGES")){return}
  
    if(!args[0]){
      message.reply("Please define a number of channels to delete or a specific user's messages to delete.")
    }else if(messagecount >= 100){
      return message.reply("You cannot delete 100 or more messages at once!")
    }else if(args[1]){
      const target = message.mentions.users.first()
  
        message.channel.fetchMessages({limit: messagecount + 1})
          .then(messages => {
            var msgArray = messages.array()
            msgArray = msgArray.filter(m => m.author.id === target.id)
            message.channel.bulkDelete(msgArray, true)
          })
  
      message.reply(`Deleted ${messagecount} messages from ${target.user.tag}`)
  
      }else if(args[0]){
          message.channel.fetchMessages({limit: messagecount + 1})
          //then deletes them
              .then(messages => message.channel.bulkDelete(messages, true))
          //le confirmation message
          message.reply(`**${messagecount}** message(s) deleted successfuly!`)
            .then(message=>message.react('✅'));
      }
  }
}