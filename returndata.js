/*=============================================================================================
Module Name:        returndata.js
Module Type:        Module Handler
Module Description: Contains miscelaneous modules to improve efficiency of the code.
=============================================================================================*/

/*=================================================================================
Function Name:          missingArgumentsEmbed()
Function Description:   This function returns an embed-style message to the channel
                        given in the arguments. It is called when the error
                        pertains to a missing argument in command execution.
=================================================================================*/
exports.missingArgumentsEmbed = (channel, command, args, pos) =>{
    //Require the Discord.JS library
    const Discord = require("discord.js");
    //Instantiate a new embed constructor
    var embed = new Discord.MessageEmbed()
        //In this case, the Author field is used as a pseudo-title for the embed message,
        .setAuthor("An Error occurred trying to run " + command)
        //Adds a field where the error is described to the user, and includes the function's arguments to give more detail.
        .addField("ERROR - Missing Arguments", `**${args}** was missing from your command message.\nIt should be the **${pos}** argument.`)
        //Sets a red colour to stand out
        .setColor("#ff0000")
        //Sets the footer to an identifier for debugging if needed.
        .setFooter("AEGIS-ERR_MISSING_ARGS EVENT")
        //Sets the timestamp at the bottom to the current time and date.
        .setTimestamp(new Date());
    //returns the embed to the channel from the function arguments.
    channel.send({embed});
}

/*=================================================================================
Function Name:          userNotFound()
Function Description:   This function returns an embed-style message to the channel
                        given in the arguments. It is called when the error
                        pertains to the target user not being found.
=================================================================================*/
exports.userNotFound = (channel, user) =>{
    //Require the Discord.JS library
    const Discord = require("discord.js");
    //Instantiate a new embed constructor
    var embed = new Discord.MessageEmbed()
        //In this case, the Author field is used as a pseudo-title for the embed message,
        .setAuthor("An Error occurred trying to find " + user)
        //Adds a field where the error is described to the user, and includes the function's arguments to give more detail.
        .addField("ERROR - User Not Found", `Check that your username is correct and try again.`)
        //Sets a red colour to stand out
        .setColor("#ff0000")
        //Sets the footer to an identifier for debugging if needed.
        .setFooter("AEGIS-ERR_USER_NOT_FOUND EVENT")
        .setTimestamp(new Date());
    channel.send({embed});
}

/*=================================================================================
Function Name:          invalidPermissions()
Function Description:   This function returns an embed-style message to the channel
                        given in the arguments. It is called when the error
                        pertains to the executor having invalid permissions.
=================================================================================*/
exports.invalidPermissions = (channel, command, permission) =>{
    //Require the Discord.JS library
    const Discord = require("discord.js");
    //Instantiate a new embed constructor
    var embed = new Discord.MessageEmbed()
        //In this case, the Author field is used as a pseudo-title for the embed message,
        .setAuthor("An Error occurred trying to run " + command)
        //Adds a field where the error is described to the user, and includes the function's arguments to give more detail.
        .addField("ERROR - Invalid Permissions", `**${permission}** is required to run this command.\nContact your server Administrator if you believe this to be an error.`)
        //Sets a red colour to stand out
        .setColor("#ff0000")
        //Sets the footer to an identifier for debugging if needed.
        .setFooter("AEGIS-ERR_INVALID_PERMISSIONS EVENT")
        //Sets the timestamp at the bottom to the current time and date.
        .setTimestamp(new Date());
    channel.send({embed});
}