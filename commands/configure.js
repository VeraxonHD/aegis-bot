module.exports = {
    name: "configure",
    description: "Allows Administrators to configure certain bot I/O features",
    alias: ["config", "cfg"],
    usage: "configure *<param, see below>*\n**disabledCommands** (-dc) <command name>\n**disabledLogs** (-dl) <log name>\n**logchannel** (-lc) <log channel type (moderation, voice, migration, suggestions, default)> <channel id>\n**modmail** <-mm) <category channel>\n**autorole** (-ar) <@Role>\n**auroroleenable** (-are) (toggle, no params)\n**filters** (-f) <filter name (discordInvites) or (exempt)> <if exempt: userID>\n**mutedrole** (-mr) <@Role>",
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        var errLib = require("../util/errors.js");
        var cfsLib = require("../util/globalFuncs.js");
        var dbsLib = require("../aegis.js");
        var gConfig = await cfsLib.getGuildConfig(message.guild.id);
        var GuildDB = require("../aegis.js").sendGuildDB();
        var fs = require("fs");
        var jsonfile = require("jsonfile");
        var Client = require("../aegis.js").sendClient();
        if(!message.member.hasPermission("ADMINISTRATOR")){
            errLib.invalidPermissions(message.channel, "configure", "ADMINISTRATOR")
        }else if(!args[0]){
            errLib.missingArgumentsEmbed(message.channel, "configure", "Configure Variable", "first")
        }else if(!args[1]){
            errLib.missingArgumentsEmbed(message.channel, "configure", "New Value", "second and final")
        }else{
            var convar = args[0];
            var value = args[1];

            if(convar == "disabledCommands" || convar == "-dc"){
                try{
                    var commandArray = [];
                    var counter = 0;
                    fs.readdirSync("./commands").forEach(command => {
                        commandArray[counter] = command.slice(0, command.indexOf("."));
                        counter++;
                    });
                    if(commandArray.indexOf( value) == -1){
                        return message.reply("That is not a valid command and therefore it cannot be disabled.");
                    }else{
                        if(gConfig.disabledCommands.indexOf(value) == -1){
                            gConfig.disabledCommands.push(value)
                            return message.reply(`Added **${value}** to the list of disabled commands successfully!`);
                        }else{
                            var pos = gConfig.disabledCommands.indexOf(value);
                            gConfig.disabledCommands.splice(pos, 1);
                            message.reply(`Removed **${value}** from the list of disabled commands successfully!`);
                        }
                        GuildDB.update({config: gConfig}, {where: {guildid: message.guild.id}}).catch(err =>{
                            console.error(err)
                            return message.reply(`There was an error writing to the database. Please try again later or contact Vex#1337`);
                        });
                    }
                }catch (err){
                    console.log(err)
                    return message.reply("There was an error processing that request. Try again shortly.");
                }
            }else if(convar == "disabledLogs" || convar == "-dl"){
                try{
                    var logArray = [
                        "messageDelete",
                        "messageUpdate",
                        "messageDeleteBulk",
                        "voiceStateUpdate",
                        "guildMemberAdd",
                        "guildMemberRemove"
                    ];
                    if(logArray.indexOf(value) == -1){
                        return message.reply("That is not a valid event logger and therefore it cannot be disabled.")
                    }else{
                        if(gConfig.disabledLogs.indexOf(value) == -1){
                            gConfig.disabledLogs.push(value)
                            message.reply(`Added **${value}** to the list of disabled logs successfully!`);
                        }else{
                            var pos = gConfig.disabledLogs.indexOf(value);
                            gConfig.disabledLogs.splice(pos, 1);
                            message.reply(`Removed **${value}** from the list of disabled logs successfully!`);
                        }
                        GuildDB.update({config: gConfig}, {where: {guildid: message.guild.id}}).catch(err =>{
                            console.error(err)
                            return message.reply(`There was an error writing to the database. Please try again later or contact Vex#1337`);
                        });
                    }
                }catch (err){
                    console.log(err)
                    return message.reply("There was an error processing that request. Try again shortly.");
                }
            }else if(convar == "logchannel" || convar == "-lc"){
                var typeOfChannel = args[1];
                var channelID = args[2];
                if(!args[2]){
                    return errLib.missingArgumentsEmbed(message.channel, "configure.logchannel", "channel id");
                }else{
                    var possibleTypes = [
                        "default",
                        "moderation",
                        "voice",
                        "migration",
                        "suggestions"
                    ];
                    if(possibleTypes.indexOf(typeOfChannel) == -1){
                        return message.reply(`That is not a valid channel tyle and therefore it cannot be edited.\nTry one of: ${possibleTypes}.`);
                    }else{
                        if(!message.guild.channels.cache.get(channelID)){
                            return message.reply("That channel does not exist. Please use a vaild Text Channel Snowflake.");
                        }else if(message.guild.channels.cache.get(channelID).type != "text"){
                            return message.reply("That channel is not a text channel. Please use a valid Text Channel Snowflake.");
                        }else{
                            gConfig.logchannels[typeOfChannel] = channelID;
                            GuildDB.update({config: gConfig}, {where: {guildid: message.guild.id}}).then(()=>{
                                return message.reply(`Success! Changed LogChannel type **${typeOfChannel}** to **${channelID}**`);
                            }).catch(err =>{
                                console.error(err)
                                return message.reply(`There was an error writing to the database. Please try again later or contact Vex#1337`);
                            });
                        }
                    }
                }
            }else if(convar == "modmail" || convar == "-mm"){
                if(message.author.id != "213040107278696450") return message.reply("This is an owner-level command, for the moment. Sorry for the inconvenience.");
                if(!message.guild.channels.cache.get(value)){
                    return message.reply("That channel does not exist. Please use a vaild Category Channel Snowflake.");
                }else if(message.guild.channels.cache.get(value).type != "category"){
                    return message.reply("That channel is not a category channel. Please use a valid Category Channel Snowflake.");
                }else{
                    gConfig.modmail.categorychannel = value;
                    GuildDB.update({config: gConfig}, {where: {guildid: message.guild.id}}).then(()=>{
                        return message.reply(`Success! Changed Modmail Category Channel to **${value}**`);
                    }).catch(err =>{
                        console.error(err)
                        return message.reply(`There was an error writing to the database. Please try again later or contact Vex#1337`);
                    });
                }
            }else if(convar == "autorole" || convar == "-ar"){
				var pingedRole = message.mentions.roles.first();
				if(gConfig.autorole.enabled == false){
					gConfig.autorole.enabled = true;
				}
				if(!pingedRole){
					return errLib.missingArgumentsEmbed(message.channel, "configure", "Mentioned Role", "Final");				
				}
				if(message.guild.roles.cache.has(pingedRole.id)){
                    gConfig.autorole.role = pingedRole.id;
                    GuildDB.update({config: gConfig}, {where: {guildid: message.guild.id}}).then(()=>{
                        return message.reply(`Success! Changed Auto Role to **${pingedRole.name}**`);
                    }).catch(err =>{
                        console.error(err)
                        return message.reply(`There was an error writing to the database. Please try again later or contact Vex#1337`);
                    });
				}else{
					return message.reply("That is an invalid role. Please mention the role you wish to set as the automatic role.");
				}
			}else if(convar == "autoroleenable" || convar == "-are"){
				if(value == "true"){
					gConfig.autorole.enabled = true;
				}else if(value == "false"){
					gConfig.autrole.enabled = false;
				}else{
					return message.reply("Please enter only true or false.");
                }
                GuildDB.update({config: gConfig}, {where: {guildid: message.guild.id}}).then(()=>{
                    return message.reply(`Success! Changed if autoRoler is enabled to **${value}**`);
                }).catch(err =>{
                    console.error(err)
                    return message.reply(`There was an error writing to the database. Please try again later or contact Vex#1337`);
                });
			}else if(convar == "filters" || convar == "-f"){
                if(value == "discordInvites"){
                    if(gConfig.filters.discordInvites == true){
                        gConfig.filters.discordInvites = false;
                    }else{
                        gConfig.filters.discordInvites = true;
                    }
                    GuildDB.update({config: gConfig}, {where: {guildid: message.guild.id}}).then(()=>{
                        return message.reply(`Success! Discord Invite Filter is now: ${gConfig.filters.discordInvites}`);
                    }).catch(err =>{
                        console.error(err)
                        return message.reply(`There was an error writing to the database. Please try again later or contact Vex#1337`);
                    });
                }else if(value == "exempt" || value == "allow"){
                    var exemptList = gConfig.filters.exempt;
                    var userid = args[2];
                    try{
                        Client.users.cache.get(userid);
                    }catch(err){
                        return message.reply("That user ID has never been cached by the bot, so it probably doesn't exist in any meaningful way. Try again with a different user ID.");
                    }
                    if(!exemptList.includes(userid)){
                        exemptList.push(userid)
                        message.reply(`Added <@${userid}> to the list of spam-filter exempt users successfully!`);
                    }else{
                        var pos = exemptList.indexOf(userid);
                        exemptList.splice(pos, 1);
                        message.reply(`Removed <@${userid}> from the list of spam-filter exempt users successfully!`);
                    }
                    GuildDB.update({config: gConfig}, {where: {guildid: message.guild.id}}).catch(err =>{
                        console.error(err)
                        return message.reply(`There was an error writing to the database. Please try again later or contact Vex#1337`);
                    });
                }else if(convar == "mutedrole" || convar == "-mr"){
                    var pingedRole = message.mentions.roles.first();
                    if(!pingedRole){
                        return errLib.missingArgumentsEmbed(message.channel, "configure", "Mentioned Role", "Final");				
                    }
                    if(message.guild.roles.cache.has(pingedRole.id)){
                        gConfig.mutedrole = pingedRole.id;
                        GuildDB.update({config: gConfig}, {where: {guildid: message.guild.id}}).then(()=>{
                            return message.reply(`Success! Changed Muted Role to **${pingedRole.name}**`);
                        }).catch(err =>{
                            console.error(err)
                            return message.reply(`There was an error writing to the database. Please try again later or contact Vex#1337`);
                        });
                    }else{
                        return message.reply("That is an invalid role. Please mention the role you wish to set as the muted role.");
                    }
                }
            }else{
                return message.reply("That is not a valid Config Variable.");
            }
        }
    }
}