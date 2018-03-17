var Discord = require("discord.js");
var client = new Discord.Client();
var config = require("./config.json");
var mutes = require("./mutes.json")
var prefix = config.general.prefix;
var fs = require("fs");
var Sequelize = require("sequelize");
var jsonfile = require("jsonfile");

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

client.on("ready", () => {
    console.log("Aegis Loaded.");
    console.log(`Prefix: ${prefix}`);
    UserDB.sync();
    EvidenceDB.sync();
    
    client.commands = new Discord.Collection();
    //reads the commands folder (directory) and creates an array with the filenames of the files in there.
    const commandDirArray = fs.readdirSync("./commands");
    commandDirArray.forEach(e => {
        const commandFile = require(`./commands/${e}`);
        //adds a record of a command to the collection with key field and the exports module.
        client.commands.set(commandFile.name, commandFile);
    });

    client.setInterval(() => {
        for(var i in mutes){
          var time = mutes[i].time;
          var guildID = mutes[i].guild;
          var guild = client.guilds.get(guildID);
          var member = guild.members.get(i)
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

    if(message.channel.type == "dm") return;

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
});

client.on("messageDelete", message => {
    var mcontent = message.content;
    if(mcontent.length > 1023){
        mcontent = "ERR: Message Content too long to post."
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
        .addField("The message content was", mcontent);
    logchannel.send(`**${message.author.tag}**'s message was deleted!`, {embed});
});

client.on("messageUpdate", (oldMessage, newMessage) =>{
    if(oldMessage.content.length == 0 || oldMessage.author.id === client.user.id || oldMessage.content == newMessage.content){
        return;
      }else if(newMessage.content.length == 0 || newMessage.author.id === client.user.id){
        return;
      }
      var guild = newMessage.guild;
      var embed = new Discord.RichEmbed()
        .addField("Ther ID is", `${newMessage.author.id}`, false)
        .addField("Old Message Content", oldMessage.content, false)
        .addField("New Message Content", newMessage.content, false)
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
    }
    const embed = new Discord.RichEmbed()
        .addField("Bulk Delete Log", `${messages.size} messages bulk deleted from #${messages.first().channel.name}`)
        .setColor("#C50000")
        .setTimestamp(new Date())
        .setFooter("AEGIS-BULK-DELETE Event");
    var i = 0
    if(messages.size < 25){
        messages.forEach(element => {
            i++;
            embed.addField(`Message: ${i} - ${element.author.tag}`, element.content);
        });
    }else{
        embed.addField("Could not add message information.", "Bulk Delete exceeded 25 fields.");
    }
   
    logchannel.send({embed})
});

client.on("guildCreate", guild =>{
    var logchannelIDFinder = guild.channels.find("name", "log-channel").id;
    if(!logchannelIDFinder){
      logchannelIDFinder = ""
    }
    if(!config[guild.id]){
      config[guild.id] = {
            "name": guild.name,
            "owner": guild.owner.id,
            "logchannels": {
                "default": logchannelIDFinder,
                "moderation": "",
                "voice": "",
                "migration": ""
            },
            "mutedrole": "muted"
      }
  
      jsonfile.writeFile("config.json", config, {spaces: 4}, err =>{
        if(!err){
          const embed = new Discord.RichEmbed()
            .addField("Welcome to the Aegis Community!", "Thanks for adding Aegis!")
            .addField("I highly reccomend you check out the following link for info:", "https://veraxonhd.gitbooks.io/shade-modbot/content/first-time-setup.html")
            .setColor("#30167c");
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
  
      var voicelogchannel = guild.channels.get(config[guild.id].logchannels.voice)
      if(!voicelogchannel){
        voicelogchannel = guild.channels.get(config[guild.id].logchannels.default)
        if(!voicelogchannel){
            return;
        }
      };
  
      if(!user){
        user = newMember.user
      }
  
      if(!oldMember.voiceChannel){
        embed.addField("User joined a voice channel", `${user.tag} joined ${newMember.voiceChannel.name}.`, true)
      }else if(!newMember.voiceChannel){
        embed.addField("User disconnected from voice channels", `${user.tag} left ${oldMember.voiceChannel.name}.`, true)
      }else{
        embed.setAuthor(`${user.tag} changed voice channels.`)
        if((oldMember.mute == true) || (oldMember.deaf == true) || (newMember.mute == true) || (newMember.deaf == true)){
          return;
        }else{
          embed.addField("Old channel", `${oldMember.voiceChannel.name}`, true)
          embed.addField("New channel", `${newMember.voiceChannel.name}`, true)
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
  });