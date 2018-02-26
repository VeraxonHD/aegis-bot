var Discord = require("discord.js");
var client = new Discord.Client();
var config = require("./config.json");
var prefix = config.prefix;

client.login(config.token);

client.on("ready", () => {
    console.log("Aegis Loaded.");
    console.log(`Prefix: ${prefix}`);
});

client.on("message", msg => {
    if(msg.content == `${prefix}ping`){ //prefix + "ping"
       msg.channel.send("Pong!");
    }else if(msg.content == `${prefix}hello`){
        msg.channel.send("World!")
    }
});