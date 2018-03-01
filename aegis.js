var Discord = require("discord.js");
var client = new Discord.Client();
var config = require("./config.json");
var prefix = config.prefix;
var fs = require("fs");
var logChannelRawID = ("409365588117422100");
var Sequelize = require("sequelize");

client.login(config.token);

const sequelize = new Sequelize("database", "user", "password", {
    host: "localhost",
    dialect: "sqlite",
    logging: false,
    storage: "database.sqlite"
});

const Tags = sequelize.define("tags", {
    name: {
        type: Sequelize.STRING,
        unique: true,
    },
    command: Sequelize.STRING,
    creator: {
        type: Sequelize.INTEGER,
        allowNull: false,
    }
});

//Exports
exports.dbEntry_Tags = (name, command, creator) => {
    Tags.create({
        name: name,
        command: command,
        creator: creator
    });
}
//-Exports

client.on("ready", () => {
    console.log("Aegis Loaded.");
    console.log(`Prefix: ${prefix}`);
    Tags.sync({force: true});
    
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
    //returns when message author is the bot or the message does not start with the designated prefix.
    if(!message.content.startsWith(prefix) || message.author.id == client.user.id) return;

    //sets up variables and creates a Discord.JS Collection
    const args = message.content.slice(prefix.length).split(" ");
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.alias && cmd.alias.includes(commandName));
    try{
        command.execute(message, args, prefix, client, Discord, Tags);
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
        .setColor("#c60000")
        .setTimestamp(new Date())
        .setFooter("AEGIS-DELETE Event")
        .addField(`${message.author.tag} deleted a message!`, mcontent)
        .addField("Their UserID is", message.author.id);
    logchannel.send({embed});
});