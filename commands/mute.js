module.exports = {
    name: "mute",
    description: "Mutes a user, removing permissions by adding a role.",
    alias: [],
    usgae: "mute <userid or mention> [reason]",
    permissions: "MANAGE_MESSAGES",
    execute(message, args, client) {
        var guild = message.guild;
        var Discord = require("discord.js");
        var config = require("../config.json");
        var mutes = require("../mutes.json");
        var mainfile = require("../aegis.js");
        var mutedRole = guild.roles.find(role => role.name.toLowerCase() === config[guild.id].mutedrole.toLowerCase());
        var logchannel = message.guild.channels.get(config[guild.id].modlogchannelID);
        var user = message.mentions.users.first();
        var moderator = message.author.username;
        var ms = require("ms");
        var time = args[1];
        var jsonfile = require("jsonfile");
        var reason = args.slice(2).join(" ");
        var dateformat = require("dateformat");
        var timeFormatted = dateformat(Date.now() + ms(time), "dd/mm/yyyy HH:MM:ss");

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
        }
        
        if(!mutedRole){
          mutedRole = guild.roles.find(role => role.name.toLowerCase() === "muted");
          if(!mutedRole){
            return message.channel.send("Please add a muted role to the config. You cannot mute someone without such a role. Consult the docs page for more info.");
          }
        }
        if(user.id == config.general.botID){
          return message.channel.send(":(");
        }
        if(!reason){
          reason = "No Reason Supplied.";
        }
      
        guild.member(user).addRole(mutedRole);
        mutes[user.id] = {
          "guild" : guild.id,
          "time" : Date.now() + ms(time)
        }
      
        jsonfile.writeFile("./mutes.json", mutes, {spaces: 4}, err =>{
          if(!err){
            message.channel.send("`Eos Success` - User muted successfully.");
          }else{
            message.channel.send("`Eos Error` - User could not be muted.");
            console.log(err);
          }
        })

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
            .addField("Added by", moderator.tag)
            .addField("Reason", reason)
            .addField("For", time)
            .setTimestamp(new Date())
            .setFooter("AEGIS-MUTE Command | Case ID: " + currentcaseid)
            .setColor("#00C597");
        logchannel.send(`Mute log for ${tgtmember.tag} - Case ID **${currentcaseid}**`, {embed})

        var evidencedb = mainfile.sendEvidenceDB();

        if(message.attachments.size > 0){
            message.attachments.forEach(element => {
                const attatchembed = new Discord.RichEmbed()
                    .setAuthor(`Evidence For Case ${currentcaseid}`)
                    .setImage(element.url)
                    .setFooter(`AEGIS-WARN-EVIDENCE Event | Case ID: ${currentcaseid}`);
                logchannel.send(`Mute evidence for **${tgtmember.tag}** - Case ID **${currentcaseid}**`, {embed: attatchembed});
                
                evidencedb.create({
                    userid: tgtmember.id,
                    CaseID: currentcaseid,
                    typeOf: "MUTE",
                    dateAdded: message.createdTimestamp,
                    evidenceLinks: element.url
                });
            });   
        }else{
            evidencedb.create({
                userid: tgtmember.id,
                CaseID: currentcaseid,
                typeOf: "MUTE",
                dateAdded: message.createdTimestamp,
                evidenceLinks: "No Evidence",
                reason: reason
            });
        }
    }
}