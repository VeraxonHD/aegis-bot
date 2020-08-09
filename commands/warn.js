module.exports = {
    name: "warn",
    description: "Adds a Warning to a user.",
    alias: "none",
    usage: "warn <user by id or mention>",
    permissions: "MANAGE_MESSAGES",
    async execute(message, args) {
        var errLib = require("../util/errors.js");
        var cfsLib = require("../util/globalFuncs.js");
        var mainfile = require("../aegis.js");
        var Discord = require("discord.js");
        var gConfig = await cfsLib.getGuildConfig(message.guild.id);
        
        if(!message.member.hasPermission("MANAGE_MESSAGES")){
            return errLib.invalidPermissions(message.channel, "warn", "MANAGE_MESSAGES");
        }else{
            var logchannel = await cfsLib.getLogChannel(message.guild, "moderation");
            if(!logchannel){
                   return message.channel.send("You do not have a logchannel configured. Contact your server owner.");
               }

            var moderator = message.author.tag;
            var tgtmember;
            var snowflakeRegexTest = new RegExp("([0-9]{18})");
            if(args[0].length == 18 && snowflakeRegexTest.test(args[0])){
                tgtmember = message.guild.members.cache.get(args[0]);
            }else if(message.mentions.users.first()){
                tgtmember = message.mentions.users.first();
            }else{
                return errLib.userNotFound(message.channel, args[0]);
            }
            var reason = args.slice(1).join(" ");
            if(!reason){
                reason = "No reason supplied.";
            }
            var currentcaseid = cfsLib.makeID();

            const embed = new Discord.MessageEmbed()
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
                    const attatchembed = new Discord.MessageEmbed()
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