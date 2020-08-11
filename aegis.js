var Discord = require("discord.js");
var client = new Discord.Client({partials: ["MESSAGE", "REACTION"]});
var config = require("./store/config.json");
var mutes = require("./store/mutes.json")
var cfsLib = require("./util/globalFuncs.js");
var prefix = config.prefix;
var fs = require("fs");
var Sequelize = require("sequelize");
var jsonfile = require("jsonfile");
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

client.login(config.token);

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
    username: Sequelize.STRING,
    globalWarnings: Sequelize.INTEGER,
    globalMessageCount: Sequelize.INTEGER,
    accCreationTS: Sequelize.INTEGER,
    lastSeenTS: Sequelize.INTEGER,
    lastSeenChan: Sequelize.STRING,
    lastSeenGuild: Sequelize.STRING
});

const EvidenceDB = sequelize.define("evidencedb", {
    userid: Sequelize.INTEGER,
    CaseID: {
        type: Sequelize.STRING,
        unique: true
    },
    typeOf: Sequelize.STRING,
    dateAdded: Sequelize.INTEGER,
    evidenceLinks: Sequelize.STRING,
    reason: Sequelize.STRING
});

const PartyDB = sequelize.define("partydb", {
    partyID: {
        type: Sequelize.STRING,
        unique: true
    },
    partyName: Sequelize.STRING,
    ownerID: Sequelize.INTEGER,
    voiceChannelID: Sequelize.STRING,
    textChannelID: Sequelize.STRING,
    categoryID: Sequelize.STRING
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

const GuildDB = sequelize.define("guilddb", {
    guildid: {
        type: Sequelize.STRING,
        unique: true
    },
    ownerid: Sequelize.STRING,
    config: Sequelize.JSON,
    members: Sequelize.JSON
});

const TagsDB = sequelize.define("tagsdb", {
    guildid: Sequelize.STRING,
    name: Sequelize.STRING,
    command: Sequelize.STRING,
    creator: Sequelize.STRING
});

exports.sendUserDB = () =>{
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

exports.sendGuildDB = () =>{
    return GuildDB;
}

exports.sendTagsDB = () =>{
    return TagsDB;
};

client.on("ready", async () => {
    console.log("Aegis Loaded.");
    console.log(`Prefix: ${prefix}`);
    UserDB.sync();
    EvidenceDB.sync();
    PartyDB.sync();
    ReactDB.sync();
    ModmailDB.sync();
    GuildDB.sync();
    TagsDB.sync();
    
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
    client.user.setPresence({ activity: { name: `Live (v3.0.0) | ${config.prefix}help` }, status: 'online' });
    
    client.setInterval(async () => {
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
            var mutedRole = guild.roles.cache.find(role => role.name.toLowerCase() === gConfig.mutedrole.toLowerCase());
            var logchannel = await cfsLib.getLogChannel(guild, "moderation");
            
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

client.on("message", async message => {
    if(message.system || message.webhookID != null){return}
    if(message.channel.type != "dm"){
        var gConfig = await cfsLib.getGuildConfig(message.guild.id);
        GuildDB.findOne({where:{guildid: message.guild.id}}).then(row =>{
            if(!row){
                console.log("bruh")
            }else{
                var guildUserData = row.members;
                if(!guildUserData[message.author.id]){
                    guildUserData[message.author.id] = {
                        "id": message.author.id,
                        "messageCount": 1,
                        "joinDateTime": message.member.joinedAt,
                        "warnings": 0
                    }
                    console.log(`Added user data of ${message.author.tag} to ${message.guild.name}`)
                }else{
                    guildUserData[message.author.id].messageCount++;
                }
                GuildDB.update({members: guildUserData}, {where: {guildid: message.guild.id}});
            }
        })
        UserDB.findOne({
            where: {userid: message.author.id}
        }).then(row =>{
            if(!row){
                UserDB.create({
                    userid: message.author.id,
                    username: message.author.tag,
                    globalWarnings: 0,
                    globalMessageCount: 1,
                    accCreationTS: message.author.createdTimestamp,
                    lastSeenTS: message.createdTimestamp,
                    lastSeenChan: message.channel.name,
                    lastSeenGuild: message.guild.name
                })
            }else{
                sequelize.query(`UPDATE userdbs SET globalMessageCount = globalMessageCount + 1 WHERE userid = '${message.author.id}'`);
                UserDB.update({lastSeenTS: message.createdTimestamp}, {where: {userid: message.author.id}});
                UserDB.update({lastSeenChan: message.channel.name}, {where: {userid: message.author.id}});
                UserDB.update({lastSeenGuild: message.guild.name}, {where: {userid: message.author.id}});
            }
        })
        
        if(!message.content.startsWith(prefix) || message.author.id == client.user.id) return;
        
        const args = message.content.slice(prefix.length).split(" ");
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.alias && cmd.alias.includes(commandName));
        
        if(!command){
            return;
        }
        
        if(gConfig.disabledCommands.indexOf(commandName) != -1){
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
    }/* TODO: RE-WRITE MODMAIL
    else if (message.channel.type == "dm"){
        if(message.author.id == client.user.id){
            return;
        }
        
        //Establish Guild IDs
        for(var guild in config){
            if(gConfig[guild].modmail && gConfig[guild].modmail.enabled == true){
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
        var catChan = serveGuild.channels.cache.get(gConfig[serveGuild.id].modmail.categorychannel)
        
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
                        for(var allowedRole in gConfig[serveGuild.id].modmail.allowedRoles){
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
    } */  
});

//MODMAIL CHANNEL COMMAND HANDLING - TODO: RE-WRITE MODMAIL
/* client.on("message", async message => {
    //If the user DMs the bot, disregard it.
    if(message.channel.type == "dm") return;
    //If the message does not start with the prefix or the bot is the author of the message, disregard it.
    if(!message.content.startsWith(prefix) || message.author.id == client.user.id) return;
    
    /*=================================================================================
    Function Name:          Command Handler
    Function Description:   Handles the loading and execution of all command modules
    quickly and efficiently.
    ================================================================================
    
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
}) */

//Discord Invite Link Filter Handling
client.on("message", async message => {
    if(message.channel.type == "dm") return;    
    var guild = message.guild;
    var gConfig = await cfsLib.getGuildConfig(guild.id);
    
    if(gConfig.filters.discordInvites == true){
        var regexpapttern = /(?:https?:\/\/)?(?:www\.)?discord(?:\.gg|(?:app)?\.com\/invite)\/(\S+)/
        var regexp = new RegExp(regexpapttern);
        if(!regexp.test(message.content)){
            return
        }
        var captures = message.content.match(regexpapttern)
        client.fetchInvite(captures[0]).then(async invite =>{
            //guild.invites.has?
            if(invite.guild.id != guild.id && !gConfig.filters.exempt.includes(message.author.id)){
                var currentcaseid = cfsLib.makeID();
                EvidenceDB.create({
                    userid: message.author.id,
                    CaseID: currentcaseid,
                    typeOf: "WARN",
                    dateAdded: message.createdTimestamp,
                    evidenceLinks: "Automated Response",
                    reason: "Automated action taken due to spammed Discord Link."
                });
                message.reply("This server does not allow users to send Discord Links. You have been warned for this infraction.");
                var logchannel = await cfsLib.getLogChannel(guild, "moderation");
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
        console.log(gConfig.filters.repeatMessage);
    }
});

//General Spam Detection (Repeat/Identical Messages)
client.on("message", async message =>{
    if(message.channel.type == "dm") return;
    var guild = message.guild;
    var gConfig = await cfsLib.getGuildConfig(guild.id);

    if(gConfig.filters.repeatMessage == true){
        antiSpam.message(message);
    }
});
antiSpam.on("warnAdd", async member =>{
    var currentcaseid = cfsLib.makeID();
    EvidenceDB.create({
        userid: member.id,
        CaseID: currentcaseid,
        typeOf: "WARN",
        dateAdded: new Date(),
        evidenceLinks: "Automated Response",
        reason: "Automated action taken due to repeated spam."
    });
    
    var logchannel = await cfsLib.getLogChannel(member.guild, "moderation");

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
client.on("messageDelete", async message => {
    var mcontent = message.content;
    var gConfig = await cfsLib.getGuildConfig(message.guild.id);
    if(mcontent.length > 1023){
        mcontent = "ERR: Message Content too long to post."
    }
    
    if(gConfig.disabledLogs.indexOf("messageDelete") != -1){
        return;
    }
    var logchannel = await cfsLib.getLogChannel(message.guild, "default");
    
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
client.on("messageUpdate", async (oldMessage, newMessage) => {
    var guild = newMessage.guild;
    var gConfig = await cfsLib.getGuildConfig(guild.id);
    if(!oldMessage.content || !newMessage.content){
        return;
    }else if(oldMessage.content.length == 0 || oldMessage.author.id === client.user.id || oldMessage.content == newMessage.content || oldMessage.content.length > 1023 || newMessage.content.length > 1023){
        return;
    }else if(newMessage.content.length == 0 || newMessage.author.id === client.user.id){
        return;
    }else if(gConfig.disabledLogs.indexOf("messageUpdate") != -1){
        return;
    }
    var embed = new Discord.MessageEmbed()
    .addField("Their ID is", `${newMessage.author.id}`, false)
    .addField("Old Message Content", oldMessage.content, false)
    .addField("New Message Content", newMessage.content, false)
    .addField("The channel is", "#" + newMessage.channel.name)
    .setColor("#C3C500")
    .setTimestamp(new Date())
    .setFooter("AEGIS-EDIT Event");
    
    var logchannel = await cfsLib.getLogChannel(guild, "default");
    var userTagForMessage = newMessage.author.tag;
    if(!userTagForMessage){
        userTagForMessage = oldMessage.author.tag;
    }
    logchannel.send(`**${userTagForMessage}**'s message was edited!`, {embed});
});

//On purge command run
client.on("messageDeleteBulk", async messages =>{
    var logchannel = await cfsLib.getLogChannel(messages.first().guild, "moderation");

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
            embed.addField(`I tried to add a log channel, but you didn't give me the permission to create channels (MANAGE_CHANNELS). You must create a log channel yourself and run the command \`${config.prefix}configure logchannel default <the channel ID>\`, else my capabilities will be severely limited.`)
            logchannelIDFinder = null;
        }
    }

    GuildDB.findOne({where: {guildid: guild.id}}).then(row =>{
        if(!row){
            console.log("Create these nuts")
            GuildDB.create({
                guildid: guild.id,
                ownerid: guild.owner.id,
                config: {
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
                },
                members: {
                    [client.user.id]: {
                        "id": client.user.id,
                        "messageCount": 1,
                        "joinDateTime": new Date(),
                        "warnings": 0
                    }
                }
            })
        }
    })
});

//On voice channel change event
client.on("voiceStateUpdate", async (oldMember, newMember) => {
    
    var embed = new Discord.MessageEmbed();
    var guild = newMember.guild
    var gConfig = await cfsLib.getGuildConfig(guild.id);
    var user = newMember.user
    
    if(gConfig.disabledLogs.indexOf("voiceStateUpdate") != -1){
        return;
    }else{
        var voicelogchannel = cfsLib.getLogChannel(guild, "voice");
        
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
client.on("guildMemberRemove", async member => {
    if(member.id == client.user.id){return}
    var embed = new Discord.MessageEmbed()
    let guild = member.guild
    var gConfig = await cfsLib.getGuildConfig(guild.id);
    
    if(gConfig.disabledLogs.indexOf("guildMemberRemove") != -1){
        return;
    }
    
    embed.addField("User Left", member.user.username)
    embed.addField("User Discriminator", member.user.discriminator, true)
    embed.addField("User ID", member.user.id)
    embed.setTimestamp(new Date())
    embed.setColor("#C50000")
    embed.setThumbnail(member.user.avatarURL)
    
    var logchannel = await cfsLib.getLogChannel(guild, "migration");
    
    logchannel.send(`${member.user.tag} left the server`, {embed})
});

//On user joins guild event
client.on("guildMemberAdd", async member => {
    if(member.id == client.user.id){return}
    var embed = new Discord.MessageEmbed();
    let guild = member.guild;
    var gConfig = await cfsLib.getGuildConfig(guild.id);
    
    if(gConfig.disabledLogs.indexOf("guildMemberAdd") != -1){
        return;
    }
    if(gConfig.autorole.enabled == true && gConfig.autorole.role != null){
        var tryRole = gConfig.autorole.role;
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
    
    var logchannel = await cfsLib.getLogChannel(guild, "migration");
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
    var reactroles = require("./store/reactroles.json");
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
    var reactroles = require("./store/reactroles.json");
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

process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: \n", err);
});