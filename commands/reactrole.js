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
        if(!args[0]){
            message.reply("You are missing the **operation** argument (create/add/update/delete)"); 
        }else if(args[0] == "create"){
            /*Various error trappings
            1 - checks if the user has admin permissions. if not, returns an invalid permission error
            2-4 - checks for the existence of proper arguments. returns errors based on whichever is the first non-present argument.
            */
            if(!message.member.hasPermission("ADMINISTRATOR")){
                message.reply("You must have **ADMINISTRATOR** permissions to perform that command.");
            }else if(!args[1]){
                message.reply("You are missing the **Message ID** argument.");
            }else if(!args[2]){
                message.reply("You are missing the **Emoji ID** argument.");
            }else if(!args[3]){
                message.reply("You are missing the **Role ID** argument.");
            }else{
                //Init Variables
                var messagereadable = args[1];
                var messagecontent = args.slice(2).join(" ");

                if(reactroles[messagereadable]){
                    return message.reply("That Readable Message ID already exists. Please choose another.");
                }else{
                    message.channel.send(messagecontent).then(msg =>{
                        reactroles[messagereadable] = {
                            messageid: msg.id,
                            channelid: msg.channel.id
                        }
                        //reactroles[messagereadable].channelid = msg.channel.id
                        jsonfile.writeFile("./reactroles.json", reactroles, {spaces: 4}, err =>{
                            //If a success, end of module. Send the success to the user.
                            if(!err){
                                return message.reply(`Success! You have created ${messagereadable} with content ${messagecontent}`);
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
            var messageUnique = args[1]
            var emoji = args[2];
            var role = message.mentions.roles.first();

            if(!message.member.hasPermission("ADMINISTRATOR")){
                message.reply("You must have **ADMINISTRATOR** permissions to perform that command.");
            }else if(!args[1]){
                message.reply("You are missing the **Unique Message ID** argument.");
            }else if(!args[2]){
                message.reply("You are missing the **Emoji** argument.");
            }else if(!args[3]){
                message.reply("You are missing the **Role (mentionable)** argument.");
            }else{
                if(!reactroles[messageUnique]){
                    message.reply("That Unique Message ID does not exist. Try creating it using a!reactrole create")
                }else{
                    var emojiid = client.emojis //finish
                    console.log(emojiid)
                    var roleid = role.id;
                    console.log(roleid)
                }
            }
        }
    }
};