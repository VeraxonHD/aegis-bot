var Discord = require("discord.js");
var client = new Discord.Client();
var config = require("./config.json");
var prefix = config.general.prefix;
var fs = require("fs");
var logChannelRawID = ("419089321849520128");
var Sequelize = require("sequelize");

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
})

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
}

exports.sendDB = () =>{
    return UserDB;
}

client.on("ready", () => {
    console.log("Aegis Loaded.");
    console.log(`Prefix: ${prefix}`);
    UserDB.sync();
    
    client.commands = new Discord.Collection();
    //reads the commands folder (directory) and creates an array with the filenames of the files in there.
    const commandDirArray = fs.readdirSync("./commands");
    commandDirArray.forEach(e => {
        const commandFile = require(`./commands/${e}`);
        //adds a record of a command to the collection with key field and the exports module.
        client.commands.set(commandFile.name, commandFile);
    });
});

client.on("message", message => {
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
            .setColor("red");
        message.channel.send({embed});
    }    
});

client.on("messageDelete", message => {
    var mcontent = message.content;
    var logchannel = message.guild.channels.get(logChannelRawID);

    if(!mcontent){
        mcontent = "I could not find any content. This may have been an image post."
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
    
        var logchannel = guild.channels.get(logChannelRawID);
        var userTagForMessage = newMessage.author.tag;
        if(!userTagForMessage){
          userTagForMessage = oldMessage.author.tag;
        }
        logchannel.send(`**${userTagForMessage}**'s message was edited!`, {embed});    
})