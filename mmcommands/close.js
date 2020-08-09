module.exports= {
    //Module Properties
    name: "close",
    description: "Closes the channel and creates a pastebin record.",
    alias: ["cl", "end"],
    usage: "anonreply <message>",
    permissions: "NONE, Gated by access to Category Channel.",
    async execute(message){
        //init variables
        var guild = message.guild;
        var cfsLib = require("../util/globalFuncs.js");
        var Discord = require("discord.js");
        var PastebinAPI = require('pastebin-js');
        var gConfig = await cfsLib.getGuildConfig(message.guild.id);
            pastebin = new PastebinAPI({
            'api_dev_key' : 'acb37cf990dfdeb81006618f4d0ca1a9'
            });
        var logchannel = await cfsLib.getLogChannel(guild, "moderation");
        if(!logchannel) return;
        var mmDB = require("../aegis.js").sendModmailDB();
      
        //Fetch all messages sent in the channel, from most to least recent
        message.channel.messages.fetch().then(messages =>{
            //Then reverse the array to make it least to most recent.
            var finalArray = [];
            var mArray = messages.array();
            mArray.reverse();

            //For each message, if the message author is not the bot, append the user's tag to the message
            var index = 0;
            mArray.forEach(msg => {
                if(msg.author.id !== "416349322620305408"){
                    finalArray[index] = `${msg.author.tag} - ${msg.content}`;
                }else{
                    finalArray[index] = `[Correspondence]: ${msg.content}`;
                }
                index++
            });
      
            //Cretae a pastebin.com post, using their API, with the content being each message in the mArray[].
            //The title is the name of the user, replacing "-" with "#" for authenticity and clarity's sake for moderators.
            //The format is null, so just plaintext
            //The privacy is 1, i.e "unlisted" so you must have the link to view
            //Does not expire.
            pastebin.createPaste({
                text: finalArray.join("\n").toString(),
                title: message.channel.name.split("-").join("#"),
                format: null,
                privacy: 1,
                expiration: null
            })
            //Then, with the response from the API, delete the channel and post an embed with the link to the pastebin,
            //the name of the deleted thread and the name of the moderator that deleted it.
            .then(function (data){
                mmDB.destroy({
                    where:{
                        channelid: message.channel.id
                    }
                })
                message.channel.delete()
                .then(delchan => {
                    var embed = new Discord.MessageEmbed()
                    .addField("Thread Deleted", delchan.name, true)
                    .addField("Deleted by: ", message.author.username, true)
                    .addField("Logs:", `<${data}>`)
                    .setTimestamp(new Date());
                    //Send the embed to the log channel of the server.
                    logchannel.send({embed});
                });
            })
            //If there is an error, catch it and log it in console.
            .catch(err =>{
                console.log(err);
            });
        });
    }
};