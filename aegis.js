var Discord = require("discord.js");
var client = new Discord.Client();
var config = require("./config.json");
var mutes = require("./mutes.json")
var prefix = config.general.prefix;
var fs = require("fs");
var Sequelize = require("sequelize");
var jsonfile = require("jsonfile");
var dateformat = require("dateformat");

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

    client.user.setPresence({ game: { name: 'Development Mode Activated!', type: "Watching" }, status: 'idle' });

    client.setInterval(() => {
        for(var i in mutes){
          var time = mutes[i].time;
          var guildID = mutes[i].guild;
          var guild = client.guilds.get(guildID);
          var member = guild.members.get(i)
          if(!member) return
          var mutedRole = guild.roles.find(role => role.name.toLowerCase() === config[guild.id].mutedrole.toLowerCase());
          var logchannel = guild.channels.get(config[guild.id].logchannels.moderator)
            if(!logchannel){
                logchannel = guild.channels.get(config[guild.id].logchannels.default)
                if(!logchannel){
                    return;
                }
            }
    
          if(Date.now() > time){
            member.removeRole(mutedRole);
    
            delete mutes[i];
            jsonfile.writeFileSync("./mutes.json", mutes, {spaces:4}, function(err){
              if(err){
                console.log(err);
              }else{
                console.log("Mute removed.");
              }
            })
    
            const embed = new Discord.RichEmbed()
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
            const embed = new Discord.RichEmbed()
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
        var serveGuild = client.guilds.get("409365548766461952"); //155401990908805120
        var extGuild = client.guilds.get("409365548766461952"); //155401990908805120

        if(!serveGuild.members.get(message.author.id)){
            return message.reply("Hey! Modmail is only available on certain servers right now. Sorry for the inconvenience.");
        }

        //Establish Category Channel ID
        var catChan = extGuild.channels.get(config[extGuild.id].modmail.categorychannel)

        //Establish Role IDs
        var modRole = serveGuild.roles.find("name", "Moderator");
        var adminRole = serveGuild.roles.find("name", "Admin");

        try{
            //Attempt to find the member in the database
            ModmailDB.findOne({
                where:{
                    memberid: message.author.id
                }
            //Then send a message to their thread channel in the specified server
            }).then(row=>{
                if(row){
                    var threadGuild = client.guilds.get(row.guildid);
                    var threadChan = threadGuild.channels.get(row.channelid);
                    threadChan.send(`**[${dateformat(new Date(), "HH:MM:ss")}] <${message.author.tag}>** - ${message.content}`);
                }else{
                    //Create a new channel
                    extGuild.createChannel(`${message.author.username}-${message.author.discriminator}`, "text", [{id: extGuild.id, deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]}], "New ModMail Thread.").then(newChan => {
                        newChan.overwritePermissions(modRole, {
                            VIEW_CHANNEL: true,
                            SEND_MESSAGES: true
                        });
                        newChan.overwritePermissions(adminRole, {
                            VIEW_CHANNEL: true,
                            SEND_MESSAGES: true
                        });
                        ModmailDB.create({
                            memberid: message.author.id,
                            channelid: newChan.id,
                            guildid: extGuild.id
                        })
                        //set the parent to the category channel
                        newChan.setParent(catChan);
                        //send a message notifying online members (@here)
                        newChan.send(`@here - New ModMail Support Thread opened. Author: \`${message.author.tag}\` Time: \`${dateformat(message.createdAt, "dd/mm/yyyy - hh:MM:ss")}\``);
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
        const embed = new Discord.RichEmbed()
            .addField("An Error Occured.", error.message)
            .setTimestamp(new Date())
            .setColor("#ff0000");
        message.channel.send({embed});
    }  
})

client.on("messageDelete", message => {
    var mcontent = message.content;
    if(mcontent.length > 1023){
        mcontent = "ERR: Message Content too long to post."
    }

    if(config[message.guild.id].disabledLogs.indexOf("messageDelete") != -1){
        return;
    }
    var logchannel = message.guild.channels.get(config[message.guild.id].logchannels.default);
        if(!logchannel){
            return;
        }

    if(!mcontent){
        mcontent = "I could not find any content. This may have been an image post.";
    }
    const embed = new Discord.RichEmbed()
        .setColor("#C50000")
        .setTimestamp(new Date())
        .setFooter("AEGIS-DELETE Event")
        .addField("Their UserID is", message.author.id)
        .addField("The message content was", mcontent)
        .addField("The channel was", "#" + message.channel.name)
    logchannel.send(`**${message.author.tag}**'s message was deleted!`, {embed});
});

client.on("messageUpdate", (oldMessage, newMessage) => {
    if(oldMessage.content.length == 0 || oldMessage.author.id === client.user.id || oldMessage.content == newMessage.content || oldMessage.content.length > 1023 || newMessage.content.length > 1023){
        return;
      }else if(newMessage.content.length == 0 || newMessage.author.id === client.user.id){
        return;
      }else if(config[newMessage.guild.id].disabledLogs.indexOf("messageUpdate") != -1){
        return;
      }
      var guild = newMessage.guild;
      var embed = new Discord.RichEmbed()
        .addField("Ther ID is", `${newMessage.author.id}`, false)
        .addField("Old Message Content", oldMessage.content, false)
        .addField("New Message Content", newMessage.content, false)
        .addField("The channel is", "#" + newMessage.channel.name)
        .setColor("#C3C500")
        .setTimestamp(new Date())
        .setFooter("AEGIS-EDIT Event");
    
        var logchannel = guild.channels.get(config[guild.id].logchannels.default);
        if(!logchannel){
            return;
        }
        var userTagForMessage = newMessage.author.tag;
        if(!userTagForMessage){
          userTagForMessage = oldMessage.author.tag;
        }
        logchannel.send(`**${userTagForMessage}**'s message was edited!`, {embed});    
});

client.on("messageDeleteBulk", messages =>{
    var logchannel = messages.first().guild.channels.get(config[messages.first().guild.id].logchannels.default);
    if(!logchannel){
            return;
    }else if(config[messages.first().guild.id].disabledLogs.indexOf("messageDeleteBulk") != -1){
        return;
    }
    const embed = new Discord.RichEmbed()
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

client.on("guildCreate", guild =>{
    const embed = new Discord.RichEmbed()
        .addField("Welcome to the Aegis Community!", "Thanks for adding Aegis!")
        .addField("If you need assistance, the best place to get it is on the offical support hub", "https://discord.gg/9KpYRme")
        .setColor("#30167c");
    try {
        var logchannelIDFinder = guild.channels.find("name", "log-channel").id;
    } catch (error) {
        guild.createChannel("log-channel", "text").then(chan => {
            logchannelIDFinder = chan.id;
            chan.send("This is your new log channel! Please set permissions as you wish!");
            embed.addField("To start off, I have created a channel named log-channel where all my message logs will go.", "Feel free to set permissions for this channel, as long as I have the ability to READ_MESSAGES and SEND_MESSAGES!");
        });
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
                "migration": ""
            },
            "mutedrole": "muted",
            "modmail":{
                "enabled": false,
                "categorychannel": "",
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

client.on("voiceStateUpdate", (oldMember, newMember) => {
    
    var embed = new Discord.RichEmbed();
    var guild = oldMember.guild
    var user = newMember.user

    if(config[guild.id].disabledLogs.indexOf("voiceStateUpdate") != -1){
        return;
    }else{
        var voicelogchannel = guild.channels.get(config[guild.id].logchannels.voice)
        if(!voicelogchannel){
          voicelogchannel = guild.channels.get(config[guild.id].logchannels.default)
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

client.on("guildMemberRemove", member => {
    var embed = new Discord.RichEmbed()
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
  
      var logchannel = guild.channels.get(config[guild.id].logchannels.migration);
        if(!logchannel){
            logchannel = guild.channels.get(config[guild.id].logchannels.default);
            if(!logchannel){
                return;
            }
        }
  
      logchannel.send(`${member.user.tag} left the server`, {embed})
});
  
client.on("guildMemberAdd", member => {
    var embed = new Discord.RichEmbed()
    let guild = member.guild

    if(config[guild.id].disabledLogs.indexOf("guildMemberAdd") != -1){
        return;
    }
  
      embed.addField("User Joined", member.user.username, true)
      embed.addField("User Discriminator", member.user.discriminator, true)
      embed.addField("User ID", member.user.id)
      embed.addField("User account creation date", member.user.createdAt)
      embed.setTimestamp(new Date())
      embed.setColor("#24c500")
      embed.setThumbnail(member.user.avatarURL)
  
      var logchannel = guild.channels.get(config[guild.id].logchannels.migration);
        if(!logchannel){
            logchannel = guild.channels.get(config[guild.id].logchannels.default);
            if(!logchannel){
                return;
            }
        }
      logchannel.send(`${member.user.tag} joined the server`, {embed})
});

const events = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd',
	MESSAGE_REACTION_REMOVE: 'messageReactionRemove',
};

/*=====================================================================================
Event Name:         raw
Event Description:  Fired when any of the events from the above object are called.
                    This allows for asynchronous handling and is useful for adding
                    different reactionEmoji for use with menus and other such inputs.
=====================================================================================*/

client.on('raw', async event => {
	// `event.t` is the raw event name
	if (!events.hasOwnProperty(event.t)) return;

	const { d: data } = event;
	const user = client.users.get(data.user_id);
	const channel = client.channels.get(data.channel_id) || await user.createDM();

	// if the message is already in the cache, don't re-emit the event
	if (channel.messages.has(data.message_id)) return;
	const message = await channel.fetchMessage(data.message_id);

	// custom emojis reactions are keyed in a `name:ID` format, while unicode emojis are keyed by names
	const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name;
	const reaction = message.reactions.get(emojiKey);

	client.emit(events[event.t], reaction, user);
});
//END EVENT raw

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
    var member = message.guild.members.get(user.id);
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
                        var role = message.guild.roles.get(reactroles[messageUID][messageReaction.emoji.id])
                        member.addRole(role)
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

client.on("messageReactionRemove", (messageReaction, user) =>{
    var message = messageReaction.message;
    if(message.channel.type == "dm") return;
    var member = message.guild.members.get(user.id);
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
                        var role = message.guild.roles.get(reactroles[messageUID][messageReaction.emoji.id])
                        member.removeRole(role)
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