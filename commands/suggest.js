module.exports = {
    name: "suggest",
    description: "Gives suggestions to server staff.",
    alias: ["suggestion", "feedback"],
    usage: "suggest <content>",
    permissions: "NONE",
    execute(message, args) {
        var Discord = require("discord.js");
        var config = require("../config.json");

        var suggestionsChannel = message.guild.channels.cache.get(config[message.guild.id].logchannels.suggestions);
        if(!suggestionsChannel || suggestionsChannel.type != "text"){
            suggestionsChannel = message.guild.channels.cache.get(config[message.guild.id].logchannels.default);
        }

        console.log(suggestionsChannel.name);

        const embed = new Discord.MessageEmbed()
            .setAuthor(message.author.tag, message.author.avatarURL)
            .addField("New suggestion/feedback from user", args.slice(0).join(" "))
            .setColor("#42b9f4")
            .setFooter("AEGIS-SUGGEST COMMAND")
            .setTimestamp(new Date());
        suggestionsChannel.send({embed})

        if(message.attachments.size > 0){
            message.attachments.forEach(element => {
                const attatchembed = new Discord.MessageEmbed()
                    .setAuthor(`Feedback Attachment from ${message.author.tag}`, message.author.avatarURL)
                    .setImage(element.url)
                    .setTimestamp(new Date())
                    .setColor("#42b9f4")
                    .setFooter(`AEGIS-SUGGEST-ATTACHMENT Event`);
                suggestionsChannel.send({embed: attatchembed});
            }); 
        };
    }
};