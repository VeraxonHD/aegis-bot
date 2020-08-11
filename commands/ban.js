module.exports = {
    name: "ban",
    description: "Bans a user from the guild.",
    alias: [],
    usage: "ban <userid/mention> [reason]",
    permissions: "BAN_MEMBERS",
    async execute(message, args, client) {
        var errLib = require("../util/errors.js");
        var cfsLib = require("../util/globalFuncs.js");
        var Discord = require("discord.js");
        var gConfig = await cfsLib.getGuildConfig(message.guild.id);
        var mainfile = require("../aegis.js");
        var moderator = message.author.tag;
        var tgtmember;
        var snowflakeRegexTest = new RegExp("([0-9]{18})");
        if(!args[0]){
            return errLib.missingArgumentsEmbed(message.channel, "Ban", "User ID or Mention", "First, followed by an optional ban reason.")
        }
            if(args[0].length == 18 && snowflakeRegexTest.test(args[0])){
                tgtmember = message.guild.members.cache.get(args[0]);
            }else if(message.mentions.users.first()){
                tgtmember = message.mentions.members.first();
            }else{
                return errLib.userNotFound(message.channel, args[0]);
            }

        if(!message.member.hasPermission("BAN_MEMBERS")){
            return errLib.invalidPermissions(message.channel, "ban", "BAN_MEMBERS")
        }else if(tgtmember.bannable == false){
            return message.reply("You cannot ban that user.")
        }
        var reason = args.slice(1).join(" ");
        if(!reason){
            reason = "No reason supplied."
        }

        var logchannel = await cfsLib.getLogChannel(message.guild, "moderation");
        var currentcaseid = cfsLib.makeID();

        message.reply(`Success! ${tgtmember.user.tag} was successfully banned from ${message.guild.name}. <:banhammer:722877640201076775>`);
        tgtmember.ban({days: 7, reason: reason});
        
        const embed = new Discord.MessageEmbed()
                .addField("User ID", tgtmember.id)
                .addField("Added by", moderator)
                .addField("Reason", reason)
                .setTimestamp(new Date())
                .setFooter("AEGIS-BAN Command | Case ID: " + currentcaseid)
                .setColor("#00C597")
            logchannel.send(`Ban log for **${tgtmember.user.tag}** - Case ID **${currentcaseid}**`, {embed})

        var evidencedb = mainfile.sendEvidenceDB();
        if(message.attachments.size > 0){
            message.attachments.forEach(element => {
                const attatchembed = new Discord.MessageEmbed()
                    .setAuthor(`Evidence For Case ${currentcaseid}`)
                    .setImage(element.url)
                    .setFooter(`AEGIS-BAN-EVIDENCE Event | Case ID: ${currentcaseid}`)
                logchannel.send(`Ban evidence for **${tgtmember.tag}** - Case ID **${currentcaseid}**`, {embed: attatchembed})
                
                evidencedb.create({
                    userid: tgtmember.id,
                    CaseID: currentcaseid,
                    typeOf: "BAN",
                    dateAdded: message.createdTimestamp,
                    evidenceLinks: element.url,
                    reason: reason
                })
            });   
        }else{
            evidencedb.create({
                userid: tgtmember.id,
                CaseID: currentcaseid,
                typeOf: "BAN",
                dateAdded: message.createdTimestamp,
                evidenceLinks: "No Evidence",
                reason: reason
            })
        }
    }
};