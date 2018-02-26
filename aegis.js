var Discord = require("discord.js");
var client = new Discord.Client();
var config = require("./config.json");
var prefix = config.prefix;
var fs = require("fs");
var logChannelRawID = ("409365588117422100");

client.login(config.token);

client.on("ready", () => {
    console.log("Aegis Loaded.");
    console.log(`Prefix: ${prefix}`);
});

client.on("message", message => {
    //returns when message author is the bot or the message does not start with the designated prefix.
    if(!message.content.startsWith(prefix) || message.author.id == client.user.id) return;

    //sets up variables and creates a Discord.JS Collection
    const args = message.content.slice(prefix.length).split(" ");
    const command = args.shift().toLowerCase();
    client.commands = new Discord.Collection();
    
    //reads the commands folder (directory) and creates an array with the filenames of the files in there.
    const commandFiles = fs.readdirSync("./commands");
    commandFiles.forEach(e => {
        const command = require(`./commands/${e}`);
        //adds a record of a command to the collection with key field and the exports module.
        client.commands.set(command.name, command);
    });

    //If the command is ping:-
    if(command == "ping"){
        //Call upon the ping command in the collection and use the .execute in that module's exports object, with the given parameters.
        client.commands.get("ping").execute(message, args);
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