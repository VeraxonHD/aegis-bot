module.exports = {
    name: "case",
    description: "Fetches cases and evidence against a user.",
    alias: ["history", "viewcases"],
    usage: "case <user>",
    permissions: "NONE",
    execute(message, args) {
        var mainfile = require("../aegis.js");
        var db = mainfile.sendEvidenceDB();
        var Discord = require("discord.js");
        var dateformat = require("dateformat");
        var util = require("../returndata.js");

        var member;
            var snowflakeRegexTest = new RegExp("([0-9]{18})");
            if(args[0].length == 18 &&snowflakeRegexTest.test(args[0])){
                member = message.guild.members.get(args[0]);
            }else if(message.mentions.users.first()){
                member = message.mentions.users.first();
            }else{
                return util.userNotFound(message.channel, args[0]);
            }

        db.findAll({where:{userid: member.id}}).then(rowarray =>{
            if(!rowarray || rowarray.length == 0){
                return message.reply("That user has no mod logs.");
            }
            const embed = new Discord.RichEmbed();
            rowarray.forEach(element => {
                embed.addField(`ID: ${element.CaseID}`, `Added: **${dateformat(element.dateAdded, "dd/mm/yyyy, hh:MM:ss")}**\nType: **${element.typeOf}**\nEvidence: ${element.evidenceLinks}\nReason: ${element.reason}`);
            });
            embed.setTimestamp(new Date());
            embed.setFooter("AEGIS-CASE Command");
            embed.setColor("#00C597");
            message.channel.send(`Mod evidence records for **${member.tag}**`,{embed});
        })
    }
};