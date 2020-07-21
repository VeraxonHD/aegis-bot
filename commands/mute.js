module.exports = {
	name: "mute",
	description: "Mutes a user, removing permissions by adding a role.",
	alias: ["m"],
	usage: "mute <userid or mention> [reason]",
	permissions: "MANAGE_MESSAGES",
	execute(message, args, client) {
		
		//Dependencies
		var Discord = require("discord.js");
		var config = require("../config.json");
		var mutes = require("../mutes.json");
		var mainfile = require("../aegis.js");
		var ms = require("ms");
		var jsonfile = require("jsonfile");
		var util = require("../util/errors.js");
		var client = mainfile.sendClient();
		
		//Module Variables
		var guild = message.guild;
		var mutedRole = guild.roles.cache.find(role => role.name.toLowerCase() === config[guild.id].mutedrole.toLowerCase());
		var logchannel = globals.getLogChannel(guild, "moderation");
		var moderator = message.author;
		var time = args[1];
		var reason = args.slice(2).join(" ");
		var snowflakeRegexTest = new RegExp("([0-9]{18})");
		
		//Permission Check/Validation
		if(!message.member.hasPermission("MANAGE_MESSAGES")){
			return util.invalidPermissions(message.channel, "mute", "MANAGE_MESSAGES")
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
			return util.userNotFound(message.channel, args[0]);
		}

		//Mute User Handling
		if(mutes[tgtmember.id]){
			return message.reply(`That user is already muted`);
		}
		tgtmember.roles.add(mutedRole);
		
		if(tgtmember.id == config.general.botID){
			return message.channel.send(":(");
		}
		if(!reason){
			reason = "No Reason Supplied.";
		}
		
		if(time == "permanent" || !time || (Date.now() + ms(time)) == null){
			mutes[tgtmember.id] = {
				"guild" : guild.id,
				"time" : "permanent",
				"reason" : reason
			}
		}else{
			mutes[tgtmember.id] = {
				"guild" : guild.id,
				"time" : Date.now() + ms(time),
				"reason" : reason
			}
		}
		
		jsonfile.writeFile("./mutes.json", mutes, {spaces: 4}, err =>{
			if(!err){
				message.channel.send("`Aegis Success` - User muted successfully.");
			}else{
				message.channel.send("`Aegis Error` - User could not be muted due to a jsonfile write error.");
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
		
		const embed = new Discord.MessageEmbed()
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
				const attatchembed = new Discord.MessageEmbed()
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