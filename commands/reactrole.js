/*=============================================================================================
Module Name:        reactrole.js
Module Type:        Command
Module Description: Allows admins to add reactions to messages.
Module Arguments:   |   #   |     Type     |          Description          |   Optional?   |
                    |   1   |   Snowflake  |          message id           |       N       |
                    |   2   |   Snowflake  |           emoji id            |       N       |
                    |   3   |   Snowflake  |            role id            |       N       |
=============================================================================================*/

module.exports = {
    //Init properties
    name: "reactrole",
    description: "Allows admins to add reactions to messages. Currently cannot be undone.",
    alias: ["rr", "addreactrole"],
    usage: "reactrole <message id> <emoji id> <role id>",
    permissions: "ADMINISTRATOR",
    async execute(message, args) {
        //Init dependencies
        const fs = require("fs");
        const reactroles = require("../reactroles.json");
        const jsonfile = require("jsonfile");
        var Discord = require("discord.js");
        var client = require("../aegis.js").sendClient();
        var util = require("../returndata.js");

        if(!args[0]){
            message.reply("You are missing the **operation** argument (create/add/update/delete)"); 
        }else if(args[0] == "create"){
            /*Various error trappings
            1 - checks if the user has admin permissions. if not, returns an invalid permission error
            2-4 - checks for the existence of proper arguments. returns errors based on whichever is the first non-present argument.
            */
            if(!message.member.hasPermission("ADMINISTRATOR")){
                return util.invalidPermissions(message.channel, "reactrole.create", "ADMINISTRATOR");
            }else if(!args[1]){
                message.reply("You are missing the **Message ID** argument.");
            }else if(!args[2]){
                message.reply("You are missing the **Emoji ID** argument.");
            }else if(!args[3]){
                message.reply("You are missing the **Role ID** argument.");
            }else{
                //Init Variables
                var messageUnique = args[1];
                var messagecontent = args.slice(2).join(" ");

                if(reactroles[messageUnique]){
                    return message.reply("That Unique Message ID already exists. Please choose another.");
                }else{
                    var embed = new Discord.RichEmbed()
                        .setAuthor(messagecontent)
                        .setFooter(`uid: ${messageUnique}`)
                        .setColor("#42f4c8");
                    message.channel.send({embed}).then(msg =>{
                        reactroles[messageUnique] = {
                            messageid: msg.id,
                            channelid: msg.channel.id
                        }
                        //reactroles[messagereadable].channelid = msg.channel.id
                        jsonfile.writeFile("./reactroles.json", reactroles, {spaces: 4}, err =>{
                            //If a success, end of module. Send the success to the user.
                            if(!err){
                                return message.reply(`Success! You have created ${messageUnique} with content ${messagecontent}`);
                            //If not, send the user an error message and print the error details to console for analysis.
                            }else{
                                console.log(err)
                                return message.reply("There was an error in this request, due to a failure to write to file. Please try again later.");
                            }
                        });
                    });
                }
            }
        }else if(args[0] == "add"){
            var messageUnique = args[1];
            var emoji = args[2];
            var role = message.mentions.roles.first();

            if(!message.member.hasPermission("ADMINISTRATOR")){
                return util.invalidPermissions(message.channel, "reactrole.add", "ADMINISTRATOR");
            }else if(!args[1]){
                message.reply("You are missing the **Unique Message ID** argument.");
            }else if(!args[2]){
                message.reply("You are missing the **Emoji** argument.");
            }else if(!args[3]){
                message.reply("You are missing the **Role (mentionable)** argument.");
            }else{
                if(!reactroles[messageUnique]){
                    message.reply("That Unique Message ID does not exist. Try creating it using a!reactrole create");
                }else{
                    
                    try{
                        emoji = emoji.split(":")[1];
                        var emojiid = client.emojis.find(val => val.name === emoji).id ;//finish
                        try{
                            var roleid = role.id;
                            reactroles[messageUnique][emojiid] = roleid;

                            jsonfile.writeFile("./reactroles.json", reactroles, {spaces: 4}, err =>{
                                //If a success, end of module. Send the success to the user.
                                if(!err){
                                    message.guild.channels.get(reactroles[messageUnique].channelid).fetchMessage(reactroles[messageUnique].messageid).then(msg =>{
                                        msg.react(client.emojis.get(emojiid))
                                    })
                                    return message.reply(`Success! You have added **${emoji}** to role **${role.name}** on message **${messageUnique}**`);
                                //If not, send the user an error message and print the error details to console for analysis.
                                }else{
                                    console.log(err)
                                    return message.reply("There was an error in this request, due to a failure to write to file. Please try again later.");
                                }
                            });

                        }catch(err){
                            console.log(err);
                            return message.reply("Could not find that role. Please ensure you are mentioning the role directly.");
                        }
                    }catch(err){
                        console.log(err);
                        return message.reply("Could not find that emoji. Please try again with a different emoji.");
                    }
                }
            }
        }else if(args[0] == "delete"){
            var messageUnique = args[1];
            var emojistring = args[2];

            if(!reactroles[messageUnique]){
                message.reply("That message unique does not exist. Please try another.");
            }else if(!message.member.hasPermission("ADMINISTRATOR")){
                return util.invalidPermissions(message.channel, "reactrole.delete", "MANAGE_MESSAGES");
            }else{
                try{
                    message.guild.channels.get(reactroles[messageUnique].channelid).fetchMessage(reactroles[messageUnique].messageid).then(msg =>{
                        msg.clearReactions();
                        msg.delete();
                        delete reactroles[messageUnique];
                        jsonfile.writeFile("./reactroles.json", reactroles, {spaces: 4}, err =>{
                            //If a success, end of module. Send the success to the user.
                            if(!err){
                                return message.reply(`Success! You have removed **${emoji}** from message **${messageUnique}**`);
                            //If not, send the user an error message and print the error details to console for analysis.
                            }else{
                                console.log(err)
                                return message.reply("There was an error in this request, due to a failure to write to file. Please try again later.");
                            }
                        });
                    })
                }catch(err){
                    console.log(err);
                }
                //Deprecated/Not working due to cache issue. May be updated in 12.0? There is a partials branch
                /*try{
                    emojistring = emojistring.split(":")[1];
                    var emoji = client.emojis.find(val => val.name === emojistring);
                    if(reactroles[messageUnique][emoji.id]){
                        message.guild.channels.get(reactroles[messageUnique].channelid).fetchMessage(reactroles[messageUnique].messageid).then(msg =>{
                            var targetreaction = msg.reactions.get(emoji.name+":"+emoji.id);
                            console.log(targetreaction);
                            targetreaction.users.forEach(user => {
                                //delete the users emoji
                            });
                        });
                        jsonfile.writeFile("./reactroles.json", reactroles, {spaces: 4}, err =>{
                            //If a success, end of module. Send the success to the user.
                            if(!err){
                                delete reactroles[messageUnique][emoji.id];
                                return message.reply(`Success! You have removed **${emoji}** from message **${messageUnique}**`);
                            //If not, send the user an error message and print the error details to console for analysis.
                            }else{
                                console.log(err)
                                return message.reply("There was an error in this request, due to a failure to write to file. Please try again later.");
                            }
                        });
                    }else{
                        message.reply("That emoji is not a member of that messageUnique. Try again with a different emoji or messageUnique.");
                    }
                }catch(err){
                    message.reply("That is not a valid emoji. Please try again with a different emoji.");
                    console.log(err);
                }*/
            }
        }
    }
};