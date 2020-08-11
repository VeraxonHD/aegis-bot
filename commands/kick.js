module.exports = {
    name: "kick",
    description: "Kick a user from the guild.",
    alias: [],
    usage: "kick <userid/mention> [reason]",
    permissions: "KICK_MEMBERS",
    async execute(message, args) {
        var errLib = require("../util/errors.js");
        var cfsLib = require("../util/globalFuncs.js");
        var Discord = require("discord.js");
        var gConfig = await cfsLib.getGuildConfig(message.guild.id);
        var moderator = message.author.tag;
        var mainfile = require("../aegis.js");
        var tgtmember;
        var snowflakeRegexTest = new RegExp("([0-9]{18})");
            if(args[0].length == 18 && snowflakeRegexTest.test(args[0])){
                tgtmember = message.guild.members.cache.get(args[0]);
            }else if(message.mentions.users.first()){
                tgtmember = message.mentions.users.first();
            }else{
                return errLib.userNotFound(message.channel, args[0]);
            }

            if(!message.member.hasPermission("KICK_MEMBERS")){
                return errLib.invalidPermissions(message.channel, "kick", "KICK_MEMBERS")
            }else if(message.guild.member(tgtmember).kickable == false){
                return message.reply("You cannot kick that user.")
            }
            var reason = args.slice(1).join(" ");
            if(!reason){
                reason = "No reason supplied."
            }

            var logchannel = await cfsLib.getLogChannel(message.guild, "moderation");
        var currentcaseid = cfsLib.makeID();

        message.guild.member(tgtmember).kick();

        const embed = new Discord.MessageEmbed()
                .addField("User ID", tgtmember.id)
                .addField("Added by", moderator)
                .addField("Reason", reason)
                .setTimestamp(new Date())
                .setFooter("AEGIS-KICK Command | Case ID: " + currentcaseid)
                .setColor("#00C597")
            logchannel.send(`Kick log for **${tgtmember.tag}** - Case ID **${currentcaseid}**`, {embed})

        var evidencedb = mainfile.sendEvidenceDB();
        if(message.attachments.size > 0){
            message.attachments.forEach(element => {
                console.log(element.id);
                const attatchembed = new Discord.MessageEmbed()
                    .setAuthor(`Evidence For Case ${currentcaseid}`)
                    .setImage(element.url)
                    .setFooter(`AEGIS-KICK-EVIDENCE Event | Case ID: ${currentcaseid}`)
                logchannel.send(`Kick evidence for **${tgtmember.tag}** - Case ID **${currentcaseid}**`, {embed: attatchembed})
                
                evidencedb.create({
                    userid: tgtmember.id,
                    CaseID: currentcaseid,
                    typeOf: "KICK",
                    dateAdded: message.createdTimestamp,
                    evidenceLinks: element.url,
                    reason: reason
                })
            });   
        }else{
            evidencedb.create({
                userid: tgtmember.id,
                CaseID: currentcaseid,
                typeOf: "KICK",
                dateAdded: message.createdTimestamp,
                evidenceLinks: "No Evidence",
                reason: reason
            })
        }
    }
};