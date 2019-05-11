module.exports = {
    name: "configure",
    description: "Allows Administrators to configure certain bot I/O features",
    alias: ["config", "cfg"],
    usage: "configure <-dc disabledCommands | -dl disabledLogs | -lc logchannel> <value> ...\n<-lc channelID>",
    permissions: "ADMINISTRATOR",
    execute(message, args) {
        var util = require("../returndata.js");
        var config = require("../config.json");
        var fs = require("fs");
        var jsonfile = require("jsonfile");
        if(!message.member.hasPermission("ADMINISTRATOR")){
            util.invalidPermissions(message.channel, "configure")
        }else if(!args[0]){
            util.missingArgumentsEmbed(message.channel, "configure", "Configure Variable", "first")
        }else if(!args[1]){
            util.missingArgumentsEmbed(message.channel, "configure", "New Value", "second and final")
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
                        if(config[message.guild.id].disabledCommands.indexOf(value) == -1){
                            config[message.guild.id].disabledCommands.push(value)
                            return message.reply(`Added **${value}** to the list of disabled commands successfully!`);
                        }else{
                            var pos = config[message.guild.id].disabledCommands.indexOf(value);
                            config[message.guild.id].disabledCommands.splice(pos, 1);
                            return message.reply(`Removed **${value}** from the list of disabled commands successfully!`);
                        }
                        jsonfile.writeFile("./config.json", config, {spaces: 4}, err =>{
                            if(err){
                                return message.reply(`There was an error writing to the file. Please try again later or contact Vex#1337`);
                            }
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
                        if(config[message.guild.id].disabledLogs.indexOf(value) == -1){
                            config[message.guild.id].disabledLogs.push(value)
                            message.reply(`Added **${value}** to the list of disabled logs successfully!`);
                        }else{
                            var pos = config[message.guild.id].disabledLogs.indexOf(value);
                            config[message.guild.id].disabledLogs.splice(pos, 1);
                            message.reply(`Removed **${value}** from the list of disabled logs successfully!`);
                        }
                        jsonfile.writeFile("./config.json", config, {spaces: 4}, err =>{
                            if(err){
                                return message.reply(`There was an error writing to the file. Please try again later or contact Vex#1337`);
                            }
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
                    return util.missingArgumentsEmbed(message.channel, "configure.logchannel", "channel id");
                }else{
                    var possibleTypes = [
                        "default",
                        "moderation",
                        "voice",
                        "migration"
                    ];
                    if(possibleTypes.indexOf(typeOfChannel) == -1){
                        return message.reply(`That is not a valid channel tyle and therefore it cannot be edited.\nTry one of: ${possibleTypes}.`);
                    }else{
                        if(!message.guild.channels.get(channelID)){
                            return message.reply("That channel does not exist. Please use a vaild Text Channel Snowflake.");
                        }else if(message.guild.channels.get(channelID).type != "text"){
                            return message.reply("That channel is not a text channel. Please use a valid Text Channel Snowflake.");
                        }else{
                            config[message.guild.id].logchannels[typeOfChannel] = channelID;
                            jsonfile.writeFile("./config.json", config, {spaces: 4}, err =>{
                                if(err){
                                    return message.reply(`There was an error writing to the file. Please try again later or contact Vex#1337`);
                                }else{
                                    return message.reply(`Success! Changed LogChannel type **${typeOfChannel}** to **${channelID}**`);
                                }
                            });
                        }
                    }
                }
            }else if(convar == "modmail" || convar == "-mm"){
                if(!message.guild.channels.get(value)){
                    return message.reply("That channel does not exist. Please use a vaild Category Channel Snowflake.");
                }else if(message.guild.channels.get(value).type != "category"){
                    return message.reply("That channel is not a category channel. Please use a valid Category Channel Snowflake.");
                }else{
                    config[message.guild.id].modmail.categorychannel = value;
                    jsonfile.writeFile("./config.json", config, {spaces: 4}, err =>{
                        if(err){
                            return message.reply(`There was an error writing to the file. Please try again later or contact Vex#1337`);
                        }else{
                            return message.reply(`Success! Changed Modmail Category Channel to **${value}**`);
                        }
                    });
                }
            }
        }
    }
}