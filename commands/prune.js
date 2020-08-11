module.exports = {
  name: "prune",
  description: "Deletes messages in bulk",
  alias: ["purge", "bulkdelete", "delete", "del"],
  usage: "prune <mentionable user>",
  permissions: "MANAGE_MESSAGES",
  async execute(message, args, prefix, client, Discord) {
    var errLib = require("../util/errors.js")
    let messagecount = parseInt(args[0]);
    
    //If the user does not have the manage messages permission, ignore the execution.
    if (!message.member.hasPermission("MANAGE_MESSAGES")){
      return errLib.invalidPermissions(message.channel, "prune", "MANAGE_MESSAGES")
    }
    
    //If the message count is not a number, return an error message
    if(isNaN(messagecount)){
      return message.reply("Your message count is invalid - it must be a parsable integer (e.g '5')");
    }
    //If there is no first argument
    if(!args[0]){
      //Return an error to the user
      message.reply("Please define a number of messages to delete or a specific user's messages to delete.")
    //Else if the message count is greater than 100
    }else if(messagecount >= 100){
      //Return an error - due to a Discord.js limitation, only 100 messages can be deleted at once.
      return message.reply("You cannot delete 100 or more messages at once!")
    //else if there is a second arg - implying the user has targeted a user for selection from bulk delete.
    }else if(args[1]){
      //Set the target equal to the mentioned user's member object.
      const target = message.mentions.users.first();
      //if no target, reply user not found error message.
      if(!target){
        return errLib.userNotFound(message.channel, args[1])
      }
      //Fetch messages up to the message count limit + 2 (includes the user's message and the confirmation message for clean up purposes.)  
      message.channel.messages.fetch({limit: messagecount + 2})
      //Then filter them into an array and remove any messages not sent by the target, then bulk delete them.
      .then(messages => {
        var msgArray = messages.array()
        msgArray = msgArray.filter(m => m.author.id === target.id)
        message.channel.bulkDelete(msgArray, true)
      })
      
      //reply with confirmation
      message.reply(`Deleted ${messagecount} messages from ${target.tag}`)
      
    //Else if there is no second arg and a first arg
    }else if(args[0] && !args[1]){
      //fetches messages + 1 to include execution message,
      message.channel.messages.fetch({limit: messagecount + 1})
      //then deletes them
      .then(messages => message.channel.bulkDelete(messages, true))
      //and sends confirmation message
      message.reply(`**${messagecount}** message(s) deleted successfuly!`)
      .then(message=>message.react('✅'));
    }
  }
}