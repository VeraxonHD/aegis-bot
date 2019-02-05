module.exports = {
    name: "warn",
    description: "Adds a Warning to a user.",
    alias: "none",
    usage: "warn <user by id or mention>",
    permissions: "MANAGE_MESSAGES",
    execute(message, args) {
        var mainfile = require("../aegis.js");
        var Discord = require("discord.js");
        var config = require("../config.json")
        if(!message.member.hasPermission("MANAGE_MESSAGES")){
            return message.reply("You do not have permission to perform this command.");
        }else{
            var logchannel = message.guild.channels.get(config[message.guild.id].logchannels.moderator);
            if(!logchannel){
                logchannel = message.guild.channels.get(config[message.guild.id].logchannels.default);
                if(!logchannel){
                    return message.channel.send("You do not have a logchannel configured. Contact your server owner.");
                }
            }

            var moderator = message.author.tag;
            var tgtmember;
            var snowflakeRegexTest = new RegExp("([0-9]{18})");
            if(args[0].length == 18 && snowflakeRegexTest.test(args[0])){
                tgtmember = message.guild.members.get(args[0]);
            }else if(message.mentions.users.first()){
                tgtmember = message.mentions.users.first();
            }else{
                return message.reply("User not found, use their ID or mention.");
            }
            var reason = args.slice(1).join(" ");
            if(!reason){
                reason = "No reason supplied.";
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
                .addField("User ID", tgtmember.id)
                .addField("Added by", moderator)
                .addField("Reason", reason)
                .setTimestamp(new Date())
                .setFooter("AEGIS-WARN Command | Case ID: " + currentcaseid)
                .setColor("#00C597");
            logchannel.send(`Warning log for **${tgtmember.tag}** - Case ID **${currentcaseid}**`, {embed});

            var evidencedb = mainfile.sendEvidenceDB();

            if(message.attachments.size > 0){
                message.attachments.forEach(element => {
                    const attatchembed = new Discord.RichEmbed()
                        .setAuthor(`Evidence For Case ${currentcaseid}`)
                        .setImage(element.url)
                        .setFooter(`AEGIS-WARN-EVIDENCE Event | Case ID: ${currentcaseid}`);
                    logchannel.send(`Warning evidence for **${tgtmember.tag}** - Case ID **${currentcaseid}**`, {embed: attatchembed});
                    
                    evidencedb.create({
                        userid: tgtmember.id,
                        CaseID: currentcaseid,
                        typeOf: "WARN",
                        dateAdded: message.createdTimestamp,
                        evidenceLinks: element.url
                    });
                });   
            }else{
                evidencedb.create({
                    userid: tgtmember.id,
                    CaseID: currentcaseid,
                    typeOf: "WARN",
                    dateAdded: message.createdTimestamp,
                    evidenceLinks: "No Evidence",
                    reason: reason
                });
            }
            if(mainfile.warnAdd(tgtmember.id) == true){
                message.reply(`Warn added to user ${tgtmember.id}`);
            }else{
                message.reply("I had an issue adding that warning. They probably don't exist in the database.");
            }
        }
    }
};