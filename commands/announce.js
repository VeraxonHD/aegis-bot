module.exports = {
    name: "announce",
    description: "Allows automated pinging of 'restricted' roles e.g Server News.",
    alias: ["NONE"],
    usage: `announce <channel> "<Role Name>" <content> (include the ""s)`,
    permissions: "NONE",
    execute(message, args) {
        var Discord = require("discord.js");

        var tgtChannel = message.mentions.channels.first();

        var firstIndex = message.content.indexOf(`"`);
        var secondIndex = message.content.indexOf(`"`, firstIndex + 1);
        var roleName = message.content.substring(firstIndex + 1, secondIndex);
        var role = message.guild.roles.cache.find(r => r.name == roleName);

        var content = message.content.substring(secondIndex + 1, message.content.length);

        if(!role){
            return message.reply("That Role was not found. Make sure the role name is encapsulated in quotation marks e.g \`\"Role Name\"\`");
        }else{
            var embed = new Discord.MessageEmbed()
                .setAuthor(message.member.displayName, message.author.avatarURL)
                .setColor("#42f4aa")
                .addField(`Announcement for ${roleName}`, content)
                .setFooter("AEGIS-ANNOUNCE COMMAND")
                .setTimestamp(new Date());
            if(role.mentionable){
                tgtChannel.send(role, {embed});
            }else{
                role.setMentionable(true).then(async mentionableRoleTrue =>{
                    await message.channel.send(role, {embed});
                    await mentionableRoleTrue.setMentionable(false);
                });
            };
        };
    }
};