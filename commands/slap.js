module.exports = {
    name: "slap",
    description: "Humiliation!",
    alias: ["pimpslap", "humiliate"],
    usgae: "slap <userid or mention>",
    permissions: "MANAGE_MESSAGES",
    execute(message, args) {
        if(!message.member.hasPermission("MANAGE_MESSAGES")){
           return message.reply("You do not have permission to access that command.")
        }
        if(args[0].length == 18){
            var member = message.guild.members.get(args[0]);
            if(member){
                return message.channel.send(`As a pimp, <@${message.author.id}> reaches back and slaps dafuq out of <@${member.id}>. Press F to pay respects.`)
            }else{
                return message.channel.send("I could not find that user from that ID. Check it or mention them.")
            }
        }else if(message.mentions.users.first()){
            return message.channel.send(`As a pimp, <@${message.author.id}> reaches back and slaps dafuq out of <@${message.mentions.users.first().id}>. Press F to pay respects.`)
        }else{
            return message.channel.send("Could not find that user. Use an ID or Mention.");
        }
    }
};