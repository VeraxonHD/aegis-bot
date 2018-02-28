module.exports = {
    name: "help",
    description: "Gives dynamic help services.",
    alias: ["support", "commands"],
    usgae: "help [command name]",
    execute(message, args, prefix, client, Discord) {
        var fs = require("fs");
        const data = [];
        const embed = new Discord.RichEmbed();
        var commandName = args[0];
            if(!commandName){
                var commandList = fs.readdirSync("./commands");
                var i = 1
                commandList.forEach(element => {
                    embed.addField("Command " + i++, element.slice(0, element.indexOf(".")));
                });
                message.reply({embed});
            }else{
                const command = client.commands.get(commandName);

                var name = command.name;
                var description = command.description;
                var alias = command.alias;
                var usgae = command.usgae;
                embed.addField("Name", name);
                embed.addField("Description", description);
                embed.addField("Aliases", alias);
                embed.addField("Usage", usgae);

                message.reply({embed});
            }
    }
};