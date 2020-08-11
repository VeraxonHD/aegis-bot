module.exports = {
    name: "userinfo",
    description: "Fetches information from the database on a specific user.",
    alias: ["ui", "info"],
    usage: "userinfo <user>",
    permissions: "MANAGE_MESSAGES",
    async execute(message, args, client) {
        var errLib = require("../util/errors.js");
        if(!message.member.hasPermission("MANAGE_MESSAGES")){
            return errLib.invalidPermissions(message.channel, "userinfo", "MANAGE_MESSAGES");
        }
        var mainfile = require("../aegis.js");
        var GuildDB = mainfile.sendGuildDB();
        var UserDB = mainfile.sendUserDB();
        var df = require("dateformat")
        var Discord = require("discord.js")

        if(!args[0]){
            return message.reply("You must tag or mention a user!")
        }
        var member;
        var snowflakeRegexTest = new RegExp("([0-9]{18})");
        if(args[0].length == 18 && snowflakeRegexTest.test(args[0])){
            member = message.guild.members.cache.get(args[0]);
        }else if(message.mentions.members.first()){
            member = message.mentions.members.first();
        }else{
            return errLib.userNotFound(message.channel, args[0]);
        }

        
        GuildDB.findOne({where:{guildid: message.guild.id}}).then(guildData =>{
            var guildMemberData = guildData.members[member.id]
            var guildData = {
                "guildJoinDateTime": guildMemberData.joinDateTime,
                "guildMessageCount": guildMemberData.messageCount,
                "guildWarnings": guildMemberData.warnings
            }
            UserDB.findOne({where:{userid: member.id}}).then(userMemberData => {
                var userData = {
                    "globalMessageCount": userMemberData.globalMessageCount,
                    "lsChannel": userMemberData.lastSeenChan,
                    "lsGuild": userMemberData.lastSeenGuild,
                    "lsTime": userMemberData.lastSeenTS,
                    "globalWarnings": userMemberData.globalWarnings,
                }
                const embed = new Discord.MessageEmbed()
                    .setAuthor(`User Data for ${member.user.tag}`)
                    .addField("General User Data", `**User ID**: ${member.id}\n**Account Tag**: ${member.user.tag}\n**Is a Bot?**: ${member.user.bot}\n**Created At**: ${member.user.createdAt}`)
                    .addField("Global Aegis Data", `**Messages Sent**: ${userData.globalMessageCount}\n**Last Seen** in ${userData.lsGuild} (#${userData.lsChan}) at ${userData.lsTime}\n**Global Warning Count**: ${userData.globalWarnings}`)
                    .addField("Guild-specific Aegis Data", `**Joined Guild At**: ${guildData.guildJoinDateTime}\n**Messages sent in server**: ${guildData.guildMessageCount}\n**Warnings in server**: ${guildData.guildWarnings}`)
                    .setColor("#00C597")
                    .setFooter("AEGIS-USERINFO Command")
                    .setTimestamp(new Date())
                message.channel.send(`Userinfo for **${member}**`, {embed})
            })
        })
    }
};