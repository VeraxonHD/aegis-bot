module.exports = {
	name: "unmute",
	description: "Unmutes a user",
	alias: ["um"],
	usage: "unmute <userid or mention>",
	permissions: "MANAGE_MESSAGES",
	async execute(message, args, client) {
		
		//Dependencies
		var Discord = require("discord.js");
		var errLib = require("../util/errors.js");
		var cfsLib = require("../util/globalFuncs.js");
		var gConfig = await cfsLib.getGuildConfig(message.guild.id);
		var mutes = require("../store/mutes.json");
		var mainfile = require("../aegis.js");
		var ms = require("ms");
		var jsonfile = require("jsonfile");
		var client = mainfile.sendClient();
		
		//Module Variables
		var guild = message.guild;
		var mutedRole = guild.roles.cache.find(role => role.name.toLowerCase() === gConfig.mutedrole.toLowerCase());
		var logchannel = await cfsLib.getLogChannel(guild, "moderation");
		var moderator = message.author;
		var time = args[1];
		var reason = args.slice(2).join(" ");
		var snowflakeRegexTest = new RegExp("([0-9]{18})");
		
		//Permission Check/Validation
		if(!message.member.hasPermission("MANAGE_MESSAGES")){
			return errLib.invalidPermissions(message.channel, "mute", "MANAGE_MESSAGES")
		}
		if(!logchannel){
			return message.channel.send("You do not have a logchannel configured. Contact your server owner.");
		}
		if(!mutedRole){
			mutedRole = guild.roles.cache.find(role => role.name.toLowerCase() === "muted");
			if(!mutedRole){
				return message.channel.send("Please add a muted role to the config. You cannot mute someone without such a role.");
			}
		}
		
		//Functions
		var tgtmember;
		if(args[0].length == 18 && snowflakeRegexTest.test(args[0])){
			tgtmember = message.guild.members.cache.get(args[0]);
		}else if(message.mentions.users.first()){
			tgtmember = message.mentions.members.first();
		}else{
			return errLib.userNotFound(message.channel, args[0]);
		}
		
		if(tgtmember.roles.cache.has(mutedRole.id)){
			tgtmember.roles.remove(mutedRole);
			
			for(var i in mutes){
				var guild = client.guilds.cache.get(mutes[i].guild);
				var member = guild.members.cache.get(i)
				if(!member){
					delete mutes[i];
					jsonfile.writeFile("./mutes.json", mutes, {spaces: 4}, err =>{
						if(!err){
							console.log("[AEGIS MUTE] - A member could not be retrieved from a mute entry and was subsequently deleted.");
						}else{
							console.log("[AEGIS MUTE] - An error occured when writing to mutes.json");
							console.log(err);
						}
					})
				}else if(i == tgtmember.id){
					delete mutes[i];
					jsonfile.writeFile("./mutes.json", mutes, {spaces: 4}, err =>{
						if(!err){
							message.channel.send("`Aegis Success` - User unmuted successfully.");
						}else{
							message.channel.send("`Aegis Error` - User could not be unmuted due to a jsonfile write error.");
							console.log(err);
						}
					})
					
					const embed = new Discord.MessageEmbed()
					.addField("User unmuted", member.displayName)
					.setColor("#00C597")
					.setFooter("AEGIS-MUTE-MANUAL_UNMUTE Command")
					.setTimestamp(new Date());
					return logchannel.send(`Mute removed manually for **${member.user.tag}** by **${moderator.tag}**`, {embed});
				}
			}
        }else{
            return message.reply("That user is not currently muted.")
        }
	}
}