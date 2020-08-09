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

        var database = mainfile.sendDB();
        database.findOne({where:{userid: member.id}}).then(row => {
            var data = {
                "globalMessageCount": row.globalMessageCount,
                "lsChannel": row.lastSeenChan,
                "lsGuild": row.lastSeenGuild,
                "lsTime": row.lastSeenTS,
                "globalWarnings": row.globalWarnings,
                "accCreation": row.accCreationTS,
                "userid": row.userid
            }
            const embed = new Discord.MessageEmbed()
                .addField("UserID", data.userid)
                .addField("Message Count", data.globalMessageCount)
                .addField("Warning Count", data.globalWarnings)
                .addField("Last Seen", `At: ${df(data.lsTime, "dd/mm/yyyy, HH:MM:ss")}\nIn: ${data.lsGuild} (#${data.lsChannel})`)
                .addField("Joined The Guild", df(member.joinedTimestamp, "dd/mm/yyyy, HH:MM:ss"))
                .setColor("#00C597")
                .setFooter("AEGIS-USERINFO Command")
                .setTimestamp(new Date())
            message.channel.send(`Userinfo for **${args[0]}**`, {embed})
        })
    }
};