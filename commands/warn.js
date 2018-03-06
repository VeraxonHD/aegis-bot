module.exports = {
    name: "warn",
    description: "Adds a Warning to a user.",
    alias: "none",
    usgae: "warn <user by id or mention>",
    permissions: "MANAGE_MESSAGES",
    execute(message, args) {
        var mainfile = require("../aegis.js");
        var Discord = require("discord.js");
        var config = require("../config.json")
        if(!message.member.hasPermission("MANAGE_MESSAGES")){
            return message.reply("You do not have permission to perform this command.");
        }else{
            var logchannel = message.guild.channels.get(config[message.guild.id].logchannels.moderator)
            if(!logchannel){
                logchannel = message.guild.channels.get(config[message.guild.id].logchannels.default)
                if(!logchannel){
                    return message.channel.send("You do not have a logchannel configured. Contact your server owner.")
                }
            }

            var moderator = message.author.tag;
            var member;
            var snowflakeRegexTest = new RegExp("([0-9]{18})");
            if(args[0].length == 18 && snowflakeRegexTest.test(args[0])){
                member = message.guild.members.get(args[0]);
            }else if(message.mentions.users.first()){
                member = message.mentions.users.first();
            }else{
                return message.reply("User not found, use their ID or mention.");
            }
            var reason = args.slice(1).join(" ");
            if(!reason){
                reason = "No reason supplied."
            }

            function makeid() {
                var text = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXY0123456789";
              
                for (var i = 0; i < 5; i++)
                  text += possible.charAt(Math.floor(Math.random() * possible.length));
              
                return text;
            }
            var currentcaseid = makeid();

            const embed = new Discord.RichEmbed()
                .addField("User ID", member.id)
                .addField("Added by", moderator)
                .addField("Reason", reason)
                .setTimestamp(new Date())
                .setFooter("AEGIS-WARN Command | Case ID: " + currentcaseid)
                .setColor("#00C597")
            logchannel.send(`Warning log for **${member.tag}** - Case ID **${currentcaseid}**`, {embed})

            if(message.attachments.exists){
                message.attachments.forEach(element => {
                    const attatchembed = new Discord.RichEmbed()
                        .setAuthor(`Evidence For Case ${currentcaseid}`)
                        .setImage(element.url)
                        .setFooter(`AEGIS-WARN-EVIDENCE Event | Case ID: ${currentcaseid}`)
                    logchannel.send(`Warning evidence for **${member.tag}** - Case ID **${currentcaseid}**`, {embed: attatchembed})
                    var evidencedb = mainfile.sendEvidenceDB();
                    evidencedb.create({
                        userid: member.id,
                        CaseID: currentcaseid,
                        typeOf: "WARN",
                        dateAdded: message.createdTimestamp,
                        evidenceLinks: element.url
                    })
                });   
            }

            if(mainfile.warnAdd(member.id) == true){
                message.reply(`Warn added to user ${member.id}`);
            }else{
                message.reply("I had an issue adding that warning. They probably don't exist in the database.");
            }
        }
    }
};