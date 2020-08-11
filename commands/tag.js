const { DiscordAPIError } = require("discord.js");

module.exports = {
    name: "tag",
    description: "Custom command handling",
    alias: ["cc", "custcom"],
    usage: "tag <{name}|create|delete|list> (create/delete)<name> (create)<name> <content>",
    permissions: "(create/delete)[MANAGE_MESSAGES] (view/list)[NONE]",
    async execute(message, args) {
        var Discord = require("discord.js");
        var cmdType = args[0];
        var mainfile = require("../aegis.js")
        var errLib = require("../util/errors.js");
        var tagsdb = mainfile.sendTagsDB();
        if(cmdType == "create"){
            if(!message.member.hasPermission("MANAGE_MESSAGES")){
                return errLib.invalidPermissions(message.channel, "tag.create", "MANAGE_MESSAGES");
            }
            else if(!args[1]){
                return message.reply("Please define a (unique) tag name.");
            }else if(!args[2]){
                return message.reply("Please give this tag some content.");
            }else if(args[1] == "list" || args[1] == "delete" || args[1] == "create"){
                return message.reply("That tag name is not allowed as it would conflict with the normal operation of this command.");
            }else{
                try{
                    tagsdb.findAll({
                        where: {
                            guildid: message.guild.id
                        }
                    }).then(rows =>{
                        var dupe = false;
                        rows.forEach(row => {
                            if(row.name == args[1]){
                                dupe = true;
                                return;
                            }
                        });
                        if(dupe == true){
                            return message.reply("Sorry, that tag name is already used on this server. Please chose a unique tag name.");
                        }else{
                            var content = args.slice(2).join(" ");
                            tagsdb.create({
                                guildid: message.guild.id,
                                name: args[1],
                                command: content,
                                creator: message.author.id
                            })
                            return message.reply("Tag Created!");
                        }
                    });
                }catch(e){
                    console.error(e);
                }
            }
        }else if(cmdType == "delete"){
            if(!message.member.hasPermission("MANAGE_MESSAGES")){
                return errLib.invalidPermissions(message.channel, "tag.create", "MANAGE_MESSAGES");
            }
            tagsdb.destroy({
                where: {
                    name: args[1],
                    guildid: message.guild.id
                }
            }).then(row =>{
                return message.reply("Tag deleted successfully");
            }).catch(e =>{
                return message.reply("That tag does not exist. Try `a!tag list`")
            })
        }else if(cmdType == "list"){
            tagsdb.findAll({
                where: {
                    guildid: message.guild.id
                }
            }).then(rows =>{
                if(rows.length == 0){
                    return message.reply("There are no tags set for this server. Try setting one using the command `a!tag create <name> <message>`");
                }else{
                    var list = "\`\`\`md\n# Tag List for this Server\`\`\`";
                    rows.forEach(row =>{
                        list += `**${row.name}** - ${row.command} (Created by ${message.guild.members.cache.get(row.creator)})\n`;
                    })
                    return message.reply(list);
                }
            })
        }else{
            try{
                tagsdb.findOne({
                    where: {
                        name: args[0],
                        guildid: message.guild.id
                    }
                }).then(row =>{
                    if(!row){
                        return message.reply("That tag does not exist. Try `a!tag list`")
                    }else{
                        message.channel.send(row.command);
                    }
                })
            }catch(e){
                console.error(e);
            }
        }
    }
};