module.exports = {
    name: "party",
    description: "Generates channels and other gubbins for parties!",
    alias: ["lobby", "newparty", "group"],
    usage: "party <create/invite/delete/kick> <(name: create) (mention/id: invite/kick)>",
    permissions: "NONE",
    execute(message, args) {
        var db = require("../aegis.js").sendPartyDB();
        if(args[0] == "create"){
            db.findOne({where:{ownerID: message.author.id}}).then(row => {
                if(!row){
                    if(!args[1]){
                        return message.reply("Please give a name for your party **ONE WORD ONLY**")
                    };
                    function makeid() {
                        var text = "";
                        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXY0123456789";
                      
                        for (var i = 0; i < 5; i++)
                          text += possible.charAt(Math.floor(Math.random() * possible.length));
                      
                        return text;
                    };
                    var partyIDGen = makeid();

                    message.guild.createChannel(args[1], "category", [{
                        id: message.author.id,
                        allow: ["CONNECT", "SPEAK", "VIEW_CHANNEL"]
                    }]).then(catchan =>{
                        message.guild.createChannel(args[1], "voice", [{
                            id: message.guild.id,
                            deny: ["VIEW_CHANNEL"]
                        }]).then(voicechan =>{
                            voicechan.setParent(catchan)
                            message.guild.createChannel(args[1], "text", [{
                                id: message.guild.id,
                                deny: ["READ_MESSAGES", "SEND_MESSAGES"]
                            }]).then(textchan =>{
                                setTimeout(function setPermissions(){
                                    textchan.overwritePermissions(message.author.id, {
                                        "READ_MESSAGES": true,
                                        "SEND_MESSAGES": true
                                    })
                                    catchan.overwritePermissions(message.guild.id, {
                                        "VIEW_CHANNEL": false 
                                    })
                                    voicechan.overwritePermissions(message.author.id, {
                                        "VIEW_CHANNEL": true
                                    })
                                    textchan.send(`<@${message.author.id}>, your party channels are here. When you wish to delete them, please type \`party delete\`. To invite others, use \`party invite <id or mention>\` from any channel.`)
                                }, 5000);
                                textchan.setParent(catchan)
                                db.create({
                                    partyID: partyIDGen,
                                    partyName: args[1],
                                    ownerID: message.author.id,
                                    voiceChannelID: voicechan.id,
                                    textChannelID: textchan.id,
                                    categoryID: catchan.id
                                });
                            });
                        });
                    });
                    return message.reply("Your party channels have been requested. Please allow for up to 5 seconds for them to spawn. If you have any issues, contact your server staff immediately.")
                }else{
                    return message.reply("You already own a party. Disband it with `party delete` or invite with `party invite <mention>`");
                }
            });
        }else if(args[0] == "invite"){
            db.findOne({where:{ownerID: message.author.id}}).then(row => {
                if(!row){
                    return message.reply("You don't have a party created. Use `party create <name>` to create one.");
                }
                var partyName = row.partyName;
                var voicechannel = message.guild.channels.get(`${row.voiceChannelID}`);
                var textchannel = message.guild.channels.get(`${row.textChannelID}`);
                if(!voicechannel || !textchannel){
                    return message.reply("That channel no longer exists. Try `party delete` and then `party create <name>`");
                }
                var invitetgt;
                var snowflakeRegexTest = new RegExp("([0-9]{18})");
                if(args[1].length == 18 && snowflakeRegexTest.test(args[1])){
                    invitetgt = message.guild.members.get(args[1]);
                }else if(message.mentions.users.first()){
                    invitetgt = message.mentions.users.first();
                }else{
                    return message.reply("User not found, use their ID or mention.");
                };
                invitetgt.send(`You have been invited to ${row.partyName} by ${message.author.tag}. You can find the voice channel in ${message.guild.name}'s channels sidebar!`);
                voicechannel.overwritePermissions(invitetgt.id, {
                    "VIEW_CHANNEL": true,
                    "CONNECT": true,
                    "SPEAK": true
                });
                textchannel.overwritePermissions(invitetgt.id, {
                    "READ_MESSAGES": true,
                    "SEND_MESSAGES": true
                });
                textchannel.send(`Welcome to the party, <@${invitetgt.id}>`)
            });
        }else if(args[0] == "delete"){
            db.findOne({where:{ownerID: message.author.id}}).then(row => {
                if(!row){
                    return message.reply("You do not own a party and therefore cannot delete one!")
                }
                var voicechannel = message.guild.channels.get(`${row.voiceChannelID}`);
                var textchannel = message.guild.channels.get(`${row.textChannelID}`);
                var catchannel = message.guild.channels.get(`${row.categoryID}`);
                voicechannel.delete();
                textchannel.delete();
                catchannel.delete();
            
                setTimeout(function deleteRow(){
                    db.destroy({where: {ownerID: message.author.id}});
                }, 2000)
                return message.reply("Your party was deleted successfully.");
            })
        }else if(args[0] == "kick"){
            db.findOne({where:{ownerID: message.author.id}}).then(row => {
                if(!row){
                    return message.reply("You do not own a party. Create one with `party create <name>`");
                }else{
                    var textchannel = message.guild.channels.get(`${row.textChannelID}`);
                    var voicechannel = message.guild.channels.get(`${row.voiceChannelID}`);
                    var channelToMove = message.guild.afkChannel;
                    if(!channelToMove){
                        message.guild.channels.forEach(element => {
                            if(element.type == "voice"){
                                channelToMove = element.id
                            }
                        });
                    };
                    var tgtmember;
                    var snowflakeRegexTest = new RegExp("([0-9]{18})");
                    if(args[1].length == 18 && snowflakeRegexTest.test(args[1])){
                        tgtmember = message.guild.members.get(args[1]);
                    }else if(message.mentions.users.first()){
                        tgtmember = message.mentions.users.first();
                    }else{
                        return message.reply("User not found, use their ID or mention.");
                    };
                    message.guild.members.get(tgtmember.id).edit({
                        channel: channelToMove
                    });
                    tgtmember.send(`You were kicked from ${row.partyName} by ${message.author.tag}. You were sent to the nearest available channel.`);
                    voicechannel.overwritePermissions(tgtmember.id, {
                        "VIEW_CHANNEL": false,
                        "CONNECT": false,
                        "SPEAK": false
                    });
                    textchannel.overwritePermissions(tgtmember.id, {
                        "READ_MESSAGES": false,
                        "SEND_MESSAGES": false
                    });
                }
            })
        }
    }
};