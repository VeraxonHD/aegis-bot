module.exports = {
    name: "help",
    description: "Gives dynamic help services.",
    alias: ["support", "commands"],
    usage: "help [command name]",
    permissions: "NONE",
    execute(message, args, prefix, client, Discord) {
        var fs = require("fs");
        const embed = new Discord.MessageEmbed();
        var commandName = args[0];
            if(!args[0]){
                var commandlist = [];
                var counter = 0
                fs.readdirSync("./commands").forEach(command => {
                    commandlist[counter] = " " + command.slice(0, command.indexOf("."))
                    counter++
                });
                message.reply(`Here are a list of commands:**\n${commandlist}**\nTo get detailed help, use "!!help <command name>"`);
            }else{
                const command = client.commands.get(commandName);
                if(!command){
                    return message.reply("Command not found.");
                };

                var name = command.name;
                var description = command.description;
                var alias = command.alias;
                var usage = command.usage;
                var permissions = command.permissions;

                if(!alias || alias.length == 0){
                    alias = "None";
                };
                embed.addField("Name", name, true);
                embed.addField("Description", description, true);
                embed.addField("Aliases", alias, true);
                embed.addField("Usage", usage, true);
                embed.addField("Permissions", permissions, true);
                embed.setTimestamp(new Date());
                embed.setFooter("AEGIS-HELP Command");
                embed.setColor("#42f4c8");

                message.reply({embed});
            }
    }
};