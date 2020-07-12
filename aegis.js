var Discord = require("discord.js");
var client = new Discord.Client({partials: ["MESSAGE", "REACTION"]});
var config = require("./config.json");
var mutes = require("./mutes.json")
var prefix = config.general.prefix;
var fs = require("fs");
var Sequelize = require("sequelize");
var jsonfile = require("jsonfile");
var dateformat = require("dateformat");
const AntiSpam = require('discord-anti-spam');
const antiSpam = new AntiSpam({
    warnThreshold: 4, // Amount of messages sent in a row that will cause a warning.
    kickThreshold: 999, // Amount of messages sent in a row that will cause a kick.
    banThreshold: 7, // Amount of messages sent in a row that will cause a ban.
    muteThreshold: 999, // Amount of messages sent in a row that will cause a mute.
    maxInterval: 3000, // Amount of time (in milliseconds) in which messages are considered spam.
    warnMessage: '{@user}, Please stop spamming.', // Message that will be sent in chat upon warning a user.
    kickMessage: '**{user_tag}** has been kicked for spamming.', // Message that will be sent in chat upon kicking a user.
    banMessage: '**{user_tag}** has been banned for spamming.', // Message that will be sent in chat upon banning a user.
    muteMessage: '**{user_tag}** has been muted for spamming.', // Message that will be sent in chat upon muting a user.
    maxDuplicatesWarning: 2, // Amount of duplicate messages that trigger a warning.
    maxDuplicatesKick: 999, // Amount of duplicate messages that trigger a warning.
    maxDuplicatesBan: 5, // Amount of duplicate messages that trigger a warning.
    maxDuplicatesMute: 999, // Amount of duplicate messages that trigger a warning.
    // Discord permission flags: https://discord.js.org/#/docs/main/master/class/Permissions?scrollTo=s-FLAGS
    exemptPermissions: ['MANAGE_MESSAGES'], // Bypass users with any of these permissions(These are not roles so use the flags from link above).
    ignoreBots: true, // Ignore bot messages.
    verbose: true, // Extended Logs from module.
    ignoredUsers: [], // Array of User IDs that get ignored.
    // And many more options... See the documentation.
});

client.login(config.general.token);

const sequelize = new Sequelize("database", "user", "password", {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "database.sqlite"
});

const UserDB = sequelize.define("userdb", {
    userid: {
        type: Sequelize.INTEGER,
        unique: true
    },
    username: Sequelize.TEXT,
    warnings: Sequelize.INTEGER,
    messagecount: Sequelize.INTEGER,
    accCreationTS: Sequelize.INTEGER,
    lastSeenTS: Sequelize.INTEGER,
    lastSeenChan: Sequelize.TEXT,
    lastSeenGuild: Sequelize.TEXT
});

const EvidenceDB = sequelize.define("evidencedb", {
    userid: Sequelize.INTEGER,
    CaseID: {
        type: Sequelize.TEXT,
        unique: true
    },
    typeOf: Sequelize.TEXT,
    dateAdded: Sequelize.INTEGER,
    evidenceLinks: Sequelize.TEXT,
    reason: Sequelize.TEXT
});

const PartyDB = sequelize.define("partydb", {
    partyID: {
        type: Sequelize.TEXT,
        unique: true
    },
    partyName: Sequelize.TEXT,
    ownerID: Sequelize.INTEGER,
    voiceChannelID: Sequelize.TEXT,
    textChannelID: Sequelize.TEXT,
    categoryID: Sequelize.TEXT
});

const StarboardDB = sequelize.define("starboarddb", {
    messageid: {
        type: Sequelize.TEXT,
        unique: true
    },
    adder: Sequelize.TEXT,
    time: Sequelize.INTEGER
});

const ReactDB = sequelize.define("reactdb", {
    channelid: Sequelize.INTEGER,
    messageid: Sequelize.INTEGER,
    reactions: Sequelize.STRING
});

const ModmailDB = sequelize.define("modmaildb", {
    memberid: {
        type: Sequelize.STRING,
        unique: true
    },
    channelid: Sequelize.STRING,
    guildid: Sequelize.STRING
});

exports.warnAdd = (userid) =>{
    try{
        sequelize.query(`UPDATE userdbs SET warnings = warnings + 1 WHERE userid = '${userid}'`);
        var success = true;
        return success;
    }catch(e){
        console.log(e);
        var success = false;
        return success;
    }
};

exports.sendDB = () =>{
    return UserDB;
};

exports.sendEvidenceDB = () =>{
    return EvidenceDB;
};

exports.sendPartyDB = () =>{
    return PartyDB;
}

exports.sendReactDB = () =>{
    return ReactDB;
}

exports.sendClient = () =>{
    return client;
}

exports.sendModmailDB = () =>{
    return ModmailDB;
}

client.on("ready", () => {
    console.log("Aegis Loaded.");
    console.log(`Prefix: ${prefix}`);
    UserDB.sync();
    EvidenceDB.sync();
    PartyDB.sync();
    StarboardDB.sync();
    ReactDB.sync();
    ModmailDB.sync();
    
    //console.log(client.emojis)
    
    client.commands = new Discord.Collection();
    //reads the commands folder (directory) and creates an array with the filenames of the files in there.
    const commandDirArray = fs.readdirSync("./commands");
    commandDirArray.forEach(e => {
        const commandFile = require(`./commands/${e}`);
        //adds a record of a command to the collection with key field and the exports module.
        client.commands.set(commandFile.name, commandFile);
    });
    
    client.mmcommands = new Discord.Collection();
    const modcommandDirArray = fs.readdirSync("./mmcommands");
    modcommandDirArray.forEach(e => {
        const commandFile = require(`./mmcommands/${e}`);
        //Adds a record of a command to the collection with key field and the exports module.
        client.mmcommands.set(commandFile.name, commandFile);
    });
    
    //client.user.setPresence({ activity: { name: 'with my codebase' }, status: 'idle' });
    client.user.setPresence({ activity: { name: 'Live (v2.7.0) | a!help' }, status: 'online' });
    
    client.setInterval(() => {
        for(var i in mutes){
            var time = mutes[i].time;
            if(time == "permanent"){
                continue;
            }
            var guildID = mutes[i].guild;
            var guild = client.guilds.cache.get(guildID);
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
            }
            var mutedRole = guild.roles.cache.find(role => role.name.toLowerCase() === config[guild.id].mutedrole.toLowerCase());
            var logchannel = guild.channels.cache.get(config[guild.id].logchannels.moderator)
            if(!logchannel){
                logchannel = guild.channels.cache.get(config[guild.id].logchannels.default)
                if(!logchannel){
                    return;
                }
            }
            
            if(Date.now() > time){
                member.roles.remove(mutedRole);
                
                delete mutes[i];
                jsonfile.writeFileSync("./mutes.json", mutes, {spaces:4}, function(err){
                    if(err){
                        console.log(err);
                    }else{
                        console.log("Mute removed.");
                    }
                })
                
                const embed = new Discord.MessageEmbed()
                    .addField("User unmuted", member.displayName)
                    .setColor("#00C597")
                    .setFooter("AEGIS-MUTE-EXPIRE Event")
                    .setTimestamp(new Date())
                logchannel.send(`Mute expired for **${member.user.tag}**`, {embed})
            }
        }
    }, 3000);
});

client.on("message", message => {
    if(message.channel.type != "dm"){
        UserDB.create({
            userid: message.author.id,
            username: message.author.tag,
            warnings: 0,
            messagecount: 1,
            accCreationTS: message.author.createdTimestamp,
            lastSeenTS: message.createdTimestamp,
            lastSeenChan: message.channel.name,
            lastSeenGuild: message.guild.name
        }).catch(Sequelize.ValidationError, function (err) {
            //UserDB.update({messagecount: messagecount + 1}, {where: {userid: message.author.id}});
            sequelize.query(`UPDATE userdbs SET messagecount = messagecount + 1 WHERE userid = '${message.author.id}'`);
            UserDB.update({lastSeenTS: message.createdTimestamp}, {where: {userid: message.author.id}});
            UserDB.update({lastSeenChan: message.channel.name}, {where: {userid: message.author.id}});
            UserDB.update({lastSeenGuild: message.guild.name}, {where: {userid: message.author.id}});
        });
        
        if(!message.content.startsWith(prefix) || message.author.id == client.user.id) return;
        
        const args = message.content.slice(prefix.length).split(" ");
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.alias && cmd.alias.includes(commandName));
        
        if(!command){
            return;
        }
        
        if(config[message.guild.id].disabledCommands.indexOf(commandName) != -1){
            return message.reply("That command has been disabled by your server administrators.")
        }
        try{
            command.execute(message, args, prefix, client, Discord);
        }catch(error){
            console.error(error);
            const embed = new Discord.MessageEmbed()
            .addField("An Error Occured.", error.message)
            .setTimestamp(new Date())
            .setColor("#ff0000");
            message.channel.send({embed});
        }
    }else if (message.channel.type == "dm"){
        if(message.author.id == client.user.id){
            return;
        }
        
        //Establish Guild IDs
        for(var guild in config){
            if(config[guild].modmail && config[guild].modmail.enabled == true){
                var serveGuild = client.guilds.cache.get(guild);
            }
        }
        
        if(!serveGuild){
            message.channel.send("Sorry, but modmail is currently not active on any guilds. Please contact a mod/admin directly.")
        }
        
        if(!serveGuild.members.cache.get(message.author.id)){
            return message.reply("Hey! Modmail is only available on certain servers right now. Sorry for the inconvenience.");
        }
        
        //Establish Category Channel ID
        var catChan = serveGuild.channels.cache.get(config[serveGuild.id].modmail.categorychannel)
        
        try{
            //Attempt to find the member in the database
            ModmailDB.findOne({
                where:{
                    memberid: message.author.id
                }
                //Then send a message to their thread channel in the specified server
            }).then(row=>{
                if(row){
                    var threadGuild = client.guilds.cache.get(row.guildid);
                    var threadChan = threadGuild.channels.cache.get(row.channelid);
                    threadChan.send(`**[${dateformat(new Date(), "HH:MM:ss")}] <${message.author.tag}>** - ${message.content}`);
                }else{
                    //Create a new channel
                    serveGuild.channels.create(`${message.author.username}-${message.author.discriminator}`, {
                        type: "text", 
                        topic: "New ModMail Thread.",
                        permissionOverwrites: [{id: serveGuild.id, deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]}]
                    }).then(newChan => {
                        ModmailDB.create({
                            memberid: message.author.id,
                            channelid: newChan.id,
                            guildid: serveGuild.id
                        })
                        for(var allowedRole in config[serveGuild.id].modmail.allowedRoles){
                            try{
                                newChan.overwritePermissions([
                                    {
                                        id: allowedRole,
                                        allow: ["VIEW_CHANNEL", "SEND_MESSAGES"]
                                    }
                                ], "Added access for allowed modmail role.");
                            }catch(err){
                                console.log(`AEGIS MODMAIL - An invalid modmail access role has been defined for guild ${serveGuild.name}! Skipping...`);
                            }
                            
                        }
                        //set the parent to the category channel
                        newChan.setParent(catChan);
                        //send a message notifying online members (@here)
                        newChan.send(`@here - New ModMail Support Thread opened. Author: <@${message.author.id}> (ID: ${message.author.id}) Time: \`${dateformat(message.createdAt, "dd/mm/yyyy - hh:MM:ss")}\``);
                        //Send the first message to the channel with the content that the user sent in the DM to the bot.
                        newChan.send(`**[${dateformat(new Date(), "HH:MM:ss")}] <${message.author.tag}>** - ${message.content}`);
                    }).catch(err => console.log(err));
                }
            });
        }catch (err){
            console.log(err);
        }
    }  
});

//MODMAIL CHANNEL COMMAND HANDLING
client.on("message", message => {
    //If the user DMs the bot, disregard it.
    if(message.channel.type == "dm") return;
    //If the message does not start with the prefix or the bot is the author of the message, disregard it.
    if(!message.content.startsWith(prefix) || message.author.id == client.user.id) return;
    
    /*=================================================================================
    Function Name:          Command Handler
    Function Description:   Handles the loading and execution of all command modules
    quickly and efficiently.
    =================================================================================*/
    
    //Set arguments array equal to each word split by a space character
    const args = message.content.slice(prefix.length).split(" ");
    //assign the commandName variable equal to the first argument, and then pop it off of the array.
    const commandName = args.shift().toLowerCase();
    //get the command file from the collection established earlier, or find the command if an alias was given instead.
    const command = client.mmcommands.get(commandName) || client.mmcommands.find(cmd => cmd.alias && cmd.alias.includes(commandName));
    //If no such command exists, you can disregard it.
    if(!command){
        return;
    }
    
    //Try and execute the command
    try{
        command.execute(message, args, prefix, client, Discord);
        //If you cannot, throw an error in the channel it was ran in, and log it in the console.
    }catch(error){
        console.error(error);
        const embed = new Discord.MessageEmbed()
        .addField("An Error Occured.", error.message)
        .setTimestamp(new Date())
        .setColor("#ff0000");
        message.channel.send({embed});
    }  
})

//Discord Invite Link Filter Handling
client.on("message", message => {
    if(message.channel.type == "dm") return;    
    var guild = message.guild;
    var guildConfig = config[guild.id];
    
    if(guildConfig.filters.discordInvites == true){
        var regexpapttern = /(?:https?:\/\/)?(?:www\.)?discord(?:\.gg|(?:app)?\.com\/invite)\/(\S+)/
        var regexp = new RegExp(regexpapttern);
        if(!regexp.test(message.content)){
            return
        }
        var captures = message.content.match(regexpapttern)
        client.fetchInvite(captures[0]).then(invite =>{
            //guild.invites.has?
            if(invite.guild.id != guild.id && !guildConfig.filters.exempt.includes(message.author.id)){
                var currentcaseid = makeid();
                EvidenceDB.create({
                    userid: message.author.id,
                    CaseID: currentcaseid,
                    typeOf: "WARN",
                    dateAdded: message.createdTimestamp,
                    evidenceLinks: "Automated Response",
                    reason: "Automated action taken due to spammed Discord Link."
                });
                message.reply("This server does not allow users to send Discord Links. You have been warned for this infraction.");
                var logchannel = message.guild.channels.cache.get(config[message.guild.id].logchannels.moderator);
                if(!logchannel){
                    logchannel = message.guild.channels.cache.get(config[message.guild.id].logchannels.default);
                    if(!logchannel){
                        message.delete();
                        return message.channel.send("You do not have a logchannel configured. Contact your server owner.");
                    }
                }
                const embed = new Discord.MessageEmbed()
                    .addField("User ID", message.author.id)
                    .addField("Added by", "Automated Spam Filter")
                    .addField("Reason", `Posting a foreign discord link in ${message.channel.name}`)
                    .setTimestamp(new Date())
                    .setFooter("AEGIS-WARN Command | Case ID: " + currentcaseid)
                    .setColor("#00C597");
                logchannel.send(`Warning log for **${message.author.tag}** - Case ID **${currentcaseid}**`, {embed});
                message.delete();
            } 
        }).catch(console.error());
        console.log(guildConfig.filters.repeatMessage);
    }
});

//General Spam Detection (Repeat/Identical Messages)
client.on("message", message =>{
    if(message.channel.type == "dm") return;
    var guild = message.guild;

    if(config[guild.id].filters.repeatMessage == true){
        antiSpam.message(message);
    }
});
antiSpam.on("warnAdd", member =>{
    var currentcaseid = makeid();
    EvidenceDB.create({
        userid: member.id,
        CaseID: currentcaseid,
        typeOf: "WARN",
        dateAdded: new Date(),
        evidenceLinks: "Automated Response",
        reason: "Automated action taken due to repeated spam."
    });
    
    var logchannel = member.guild.channels.cache.get(config[member.guild.id].logchannels.moderator);
    if(!logchannel){
        logchannel = member.guild.channels.cache.get(config[member.guild.id].logchannels.default);
        if(!logchannel){
            return;
        }
    }

    const embed = new Discord.MessageEmbed()
        .addField("User ID", member.id)
        .addField("Added by", "Automated Spam Filter")
        .addField("Reason", `Spam`)
        .setTimestamp(new Date())
        .setFooter("AEGIS-WARN Command | Case ID: " + currentcaseid)
        .setColor("#00C597");
    logchannel.send(`Warning log for **${member.user.tag}** - Case ID **${currentcaseid}**`, {embed});
});

//On message delete event
client.on("messageDelete", message => {
    var mcontent = message.content;
    if(mcontent.length > 1023){
        mcontent = "ERR: Message Content too long to post."
    }
    
    if(config[message.guild.id].disabledLogs.indexOf("messageDelete") != -1){
        return;
    }
    var logchannel = message.guild.channels.cache.get(config[message.guild.id].logchannels.default);
    if(!logchannel){
        return;
    }
    
    if(!mcontent){
        mcontent = "I could not find any content. This may have been an image post.";
    }
    const embed = new Discord.MessageEmbed()
    .setColor("#C50000")
    .setTimestamp(new Date())
    .setFooter("AEGIS-DELETE Event")
    .addField("Their UserID is", message.author.id)
    .addField("The message content was", mcontent)
    .addField("The channel was", "#" + message.channel.name)
    logchannel.send(`**${message.author.tag}**'s message was deleted!`, {embed});
});

//On message edit event
client.on("messageUpdate", (oldMessage, newMessage) => {
    if(!oldMessage.content || !newMessage.content){
        return;
    }else if(oldMessage.content.length == 0 || oldMessage.author.id === client.user.id || oldMessage.content == newMessage.content || oldMessage.content.length > 1023 || newMessage.content.length > 1023){
        return;
    }else if(newMessage.content.length == 0 || newMessage.author.id === client.user.id){
        return;
    }else if(config[newMessage.guild.id].disabledLogs.indexOf("messageUpdate") != -1){
        return;
    }
    var guild = newMessage.guild;
    var embed = new Discord.MessageEmbed()
    .addField("Ther ID is", `${newMessage.author.id}`, false)
    .addField("Old Message Content", oldMessage.content, false)
    .addField("New Message Content", newMessage.content, false)
    .addField("The channel is", "#" + newMessage.channel.name)
    .setColor("#C3C500")
    .setTimestamp(new Date())
    .setFooter("AEGIS-EDIT Event");
    
    var logchannel = guild.channels.cache.get(config[guild.id].logchannels.default);
    if(!logchannel){
        return;
    }
    var userTagForMessage = newMessage.author.tag;
    if(!userTagForMessage){
        userTagForMessage = oldMessage.author.tag;
    }
    logchannel.send(`**${userTagForMessage}**'s message was edited!`, {embed});    
});

//On purge command run
client.on("messageDeleteBulk", messages =>{
    var logchannel = messages.first().guild.channels.cache.get(config[messages.first().guild.id].logchannels.default);
    if(!logchannel){
        return;
    }else if(config[messages.first().guild.id].disabledLogs.indexOf("messageDeleteBulk") != -1){
        return;
    }
    const embed = new Discord.MessageEmbed()
    .addField("Bulk Delete Log", `${messages.size} messages bulk deleted from #${messages.first().channel.name}`)
    .setColor("#C50000")
    .setTimestamp(new Date())
    .setFooter("AEGIS-BULK-DELETE Event");
    var i = 0
    if(messages.size < 25){
        messages.forEach(element => {
            var content = element.content
            if(!element.content){content = "No Content"}
            if(element.content.length > 1023){content = "Too Long to post content."}
            i++;
            embed.addField(`Message: ${i} - ${element.author.tag}`, content);
        });
    }else{
        embed.addField("Could not add message information.", "Bulk Delete exceeded 25 fields.");
    }
    
    logchannel.send({embed})
});

//On Guild Join event
client.on("guildCreate", guild =>{
    const embed = new Discord.MessageEmbed()
        .addField("Welcome to the Aegis Community!", "Thanks for adding Aegis!")
        .addField("If you need assistance, the best place to get it is on the offical support hub", "https://discord.gg/9KpYRme")
        .setColor("#30167c");

    var logchannelIDFinder = guild.channels.cache.find(c => c.name === "log-channel").id;
    if(!logchannelIDFinder){
        try{
            guild.createChannel("log-channel", "text").then(chan => {
                logchannelIDFinder = chan.id;
                chan.send("This is your new log channel! Please set permissions as you wish!");
                embed.addField("To start off, I have created a channel named log-channel where all my message logs will go.", "Feel free to set permissions for this channel, as long as I have the ability to READ_MESSAGES and SEND_MESSAGES!");
            });
        }catch (err){
            embed.addField(`I tried to add a log channel, but you didn't give me the permission to create channels (MANAGE_CHANNELS). You must create a log channel yourself and run the command \`${config.general.prefix}configure logchannel default <the channel ID>\`, else my capabilities will be severely limited.`)
            logchannelIDFinder = null;
        }
    }
    
    if(!config[guild.id]){
        config[guild.id] = {
            "guildid": guild.id,
            "name": guild.name,
            "owner": guild.owner.id,
            "disabledCommands": [],
            "disabledLogs": [],
            "logchannels": {
                "default": logchannelIDFinder,
                "moderation": "",
                "voice": "",
                "migration": "",
                "suggestions": ""
            },
            "mutedrole": "muted",
            "autorole": {
                "enabled": false,
                "role": ""
            },
            "modmail": {
                "enabled": false,
                "categorychannel": "",
                "allowedRoles": []
            },
            "filters": {
                "discordInvites": false,
                "repeatMessage": true,
                "blockedLinks": [],
                "exempt": []
            }
        }
        
        jsonfile.writeFile("config.json", config, {spaces: 4}, err =>{
            if(!err){
                guild.owner.send({embed}).catch(console.log);
            }else{
                console.log(err);
            }
        })
    }else{
        return
    }
});

//On Guild Leave
/* client.on("guildDelete", guild=>{
    try{
        delete config[guild.id]
    }catch(err){

    }
}); */
//On voice channel change event
client.on("voiceStateUpdate", (oldMember, newMember) => {
    
    var embed = new Discord.MessageEmbed();
    var guild = oldMember.guild
    var user = newMember.user
    
    if(config[guild.id].disabledLogs.indexOf("voiceStateUpdate") != -1){
        return;
    }else{
        var voicelogchannel = guild.channels.cache.get(config[guild.id].logchannels.voice)
        if(!voicelogchannel){
            voicelogchannel = guild.channels.cache.get(config[guild.id].logchannels.default)
            if(!voicelogchannel){
                return;
            }
        };
        
        if(!user){
            user = oldMember.user
        }
        if(!oldMember.voiceChannel && !newMember.voiceChannel) return;
        if(!oldMember.voiceChannel){
            embed.addField("User joined a voice channel", `${user.tag} joined ${newMember.voiceChannel.name}.`, true)
        }else if(!newMember.voiceChannel){
            embed.addField("User disconnected from voice channels", `${user.tag} left ${oldMember.voiceChannel.name}.`, true)
        }else{
            embed.setAuthor(`${user.tag} changed voice channels.`)
            if((oldMember.mute == true) || (oldMember.deaf == true) || (newMember.mute == true) || (newMember.deaf == true)){
                return;
            }else{
                embed.addField("Old channel", `${oldMember.voiceChannel.name}`, true);
                embed.addField("New channel", `${newMember.voiceChannel.name}`, true);
            }
        }
        
        embed.addField("User ID", newMember.id)
        embed.setColor(newMember.guild.member(client.user).highestRole.color)
        embed.setTimestamp(newMember.createdAt)
        
        var userTagForMessage = user.tag
        if(!userTagForMessage){
            userTagForMessage = user.tag
        }
        voicelogchannel.send(`**Voice Log Information for: **${userTagForMessage}`, {embed}).catch(console.log)
    } 
});

//On user leaves guild event
client.on("guildMemberRemove", member => {
    var embed = new Discord.MessageEmbed()
    let guild = member.guild
    
    if(config[guild.id].disabledLogs.indexOf("guildMemberRemove") != -1){
        return;
    }
    
    embed.addField("User Left", member.user.username)
    embed.addField("User Discriminator", member.user.discriminator, true)
    embed.addField("User ID", member.user.id)
    embed.setTimestamp(new Date())
    embed.setColor("#C50000")
    embed.setThumbnail(member.user.avatarURL)
    
    var logchannel = guild.channels.cache.get(config[guild.id].logchannels.migration);
    if(!logchannel){
        logchannel = guild.channels.cache.get(config[guild.id].logchannels.default);
        if(!logchannel){
            return;
        }
    }
    
    logchannel.send(`${member.user.tag} left the server`, {embed})
});

//On user joins guild event
client.on("guildMemberAdd", member => {
    var embed = new Discord.MessageEmbed();
    let guild = member.guild;
    
    if(config[guild.id].disabledLogs.indexOf("guildMemberAdd") != -1){
        return;
    }
    if(config[guild.id].autorole.enabled == true && config[guild.id].autorole.role != null){
        var tryRole = config[guild.id].autorole.role;
        var role = guild.roles.cache.get(tryRole);
        if(!role){
            console.log('Please add a correct role ID to the autorole config.');
        }else{
            try{
                member.roles.add(role);
                return console.log(`Gave ${member.user.tag} the established autorole ${role.name} successfully`);
            }catch (e){
                console.log('Error. Please check below for diagnostics.');
                return e;
            }
        }
    }
    
    embed.addField("User Joined", member.user.username, true)
    embed.addField("User Discriminator", member.user.discriminator, true)
    embed.addField("User ID", member.user.id)
    embed.addField("User account creation date", member.user.createdAt)
    embed.setTimestamp(new Date())
    embed.setColor("#24c500")
    embed.setThumbnail(member.user.avatarURL)
    
    var logchannel = guild.channels.cache.get(config[guild.id].logchannels.migration);
    if(!logchannel){
        logchannel = guild.channels.cache.get(config[guild.id].logchannels.default);
        if(!logchannel){
            return;
        }
    }
    logchannel.send(`${member.user.tag} joined the server`, {embed})
});

/*=====================================================================================
Event Name:         error
Event Description:  Fired when an Error occurs
=====================================================================================*/

client.on("error", error =>{
    //Send the error message to console
    console.log(`Error occured at ${error.fileName} line ${error.lineNumber}: ${error.message}`);
});
//END EVENT error

/*=====================================================================================
Event Name:         messageReactionAdd
Event Description:  Fired when a message recieves a new reaction Emoji
=====================================================================================*/

client.on("messageReactionAdd", (messageReaction, user) =>{
    var message = messageReaction.message;
    if(message.channel.type == "dm") return;
    var member = message.guild.members.cache.get(user.id);
    var reactroles = require("./reactroles.json");
    /*=================================================================================
    Function Name:          Reaction Self-Service Role Menu - "SelfRole" for short
    Function Description:   This function allows users to assign their own roles.
    This is part of my client's ethos to add automation to the
    server and alleviate stress on moderators.
    Users may pick from a list of roles that allow them to LFG
    easier, or access opt-in channels.
    =================================================================================*/
    for(var messageUID in reactroles){
        if(reactroles[messageUID].messageid == message.id){
            try{
                if(reactroles[messageUID][messageReaction.emoji.id]){
                    try{
                        var role = message.guild.roles.cache.get(reactroles[messageUID][messageReaction.emoji.id])
                        member.roles.add(role)
                        console.log(`Added ${role.name} to ${user.tag}`)
                    }catch(err){
                        console.log("An error occured trying to add the role \n"+err)
                    }
                }
            }catch(err){
                console.log("That emoji does not exist \n"+err)
            }  
        }
    }
});
//END EVENT messageReactionAdd

/*=====================================================================================
Event Name:         messageReactionRemove
Event Description:  Fired when a message loses a reaction Emoji (i.e it is removed).
=====================================================================================*/

client.on("messageReactionRemove", async (messageReaction, user) =>{
    if(messageReaction.message.partial) await messageReaction.message.fetch();
    var message = messageReaction.message;
    if(message.channel.type == "dm") return;
    var member = message.guild.members.cache.get(user.id);
    var reactroles = require("./reactroles.json");
    /*=================================================================================
    Function Name:          Anti-SelfRole
    Function Description:   This function allows users to remove the roles, if they
    have assigned them using the SelfRole function.
    =================================================================================*/
    for(var messageUID in reactroles){
        if(reactroles[messageUID].messageid == message.id){
            try{
                if(reactroles[messageUID][messageReaction.emoji.id]){
                    try{
                        var role = message.guild.roles.cache.get(reactroles[messageUID][messageReaction.emoji.id])
                        member.roles.remove(role)
                        console.log(`Removed ${role.name} from ${user.tag}`)
                    }catch(err){
                        console.log("An error occured trying to add the role \n"+err)
                    }
                }
            }catch(err){
                console.log("That emoji does not exist \n"+err)
            }  
        }
    }
});
//END EVENT messageReactionRemove

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXY0123456789";
  
    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: \n", err);
});