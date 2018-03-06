module.exports = {
    name: "help",
    description: "Gives dynamic help services.",
    alias: ["support", "commands"],
    usgae: "help [command name]",
    permissions: "NONE",
    execute(message, args, prefix, client, Discord) {
        var fs = require("fs");
        const data = [];
        const embed = new Discord.RichEmbed();
        var commandName = args[0];
            if(!commandName){
                message.reply("Please specify a command to get help on.")
            }else{
                const command = client.commands.get(commandName);
                if(!command){
                    return message.reply("Command not found.")
                }

                var name = command.name;
                var description = command.description;
                var alias = command.alias;
                var usgae = command.usgae;
                var permissions = command.permissions;

                if(!alias || alias.length == 0){
                    alias = "None"
                }
                embed.addField("Name", name, true);
                embed.addField("Description", description, true);
                embed.addBlankField();
                embed.addField("Aliases", alias, true);
                embed.addField("Usage", usgae, true);
                embed.addField("Permissions", permissions, true);
                embed.setTimestamp(new Date());
                embed.setFooter("AEGIS-HELP Command")
                embed.setColor("#42f4c8")

                message.reply({embed});
            }
    }
};