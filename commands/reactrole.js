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
        const reactroles = require("../reactroles.json");
        const jsonfile = require("jsonfile");

        /*Various error trappings
        1 - checks if the user has admin permissions. if not, returns an invalid permission error
        2-4 - checks for the existence of proper arguments. returns errors based on whichever is the first non-present argument.
        */
        if(!message.member.hasPermission("ADMINISTRATOR")){
            message.reply("You must have **ADMINISTRATOR** permissions to perform that command.");
        }else if(!args[0]){
            message.reply("You are missing the **Message ID** argument.");
        }else if(!args[1]){
            message.reply("You are missing the **Emoji ID** argument.");
        }else if(!args[2]){
            message.reply("You are missing the **Role ID** argument.");
        }else{
            //Init Variables
            var messageid = args[0];
            var emojiid = args[1];
            var roleid = args[2];

            //If this emoji is already assigned on this message, display an error.
            if(reactroles[messageid] && reactroles[messageid][emojiid]){
                return message.reply("That role already exists on that message.");
            }else{
                //Try to see if the bot client can access the emoji. If not, catch the error and report it to the user.
                try{
                    var emojiobj = message.client.emojis.get(emojiid);
                    //Try to see if the role exists on the guild. If not, catch the error and report it to the user.
                    try{
                        var roleobj = message.guild.roles.get(roleid);
                        //Try to assign the emoji to the message and then write the information to the file. If not, send an error message to console.
                        try{
                            //Assign the reaction
                            message.channel.fetchMessage(messageid).then((msg) => {
                                msg.react(emojiid);
                            });
                            //Append the information to the reactroles object
                            reactroles[messageid][emojiid] = roleid;
                            //Write the reactroles object to the file
                            jsonfile.writeFile("../reactroles.json", reactroles, {spaces: 4}, err =>{
                                //If a success, end of module. Send the success to the user.
                                if(!err){
                                    return message.reply(`Success! ${roleobj.name} assigned to ${emojiobj.name} on message ${messageid}`);
                                //If not, send the user an error message and print the error details to console for analysis.
                                }else{
                                    console.log(err)
                                    return message.reply("There was an error in this request, due to a failure to write to file. Please try again later.");
                                }
                            });
                        }catch(err){
                            console.log(err);
                        }
                    }catch(err){
                        message.reply("That role does not exist.");
                    }
                }catch(err){
                    message.reply("I do not have access to adding that emoji. Try adding a different one.");
                }
            }
        }
    }
};