module.exports = {
    name: "evidence",
    description: "Post-humously add warn evidence via Case ID",
    alias: ["addevidence", "newevidence"],
    usgae: "warnevidence + uploaded image",
    permissions: "MANAGE_MESSAGES",
    execute(message, args) {
        var Discord = require("discord.js")
        if(!message.member.hasPermission("MANAGE_MESSAGES")) return;
        var caseid = args[0];

        if(message.attachments.exists){
            message.attachments.forEach(element => {
                const attatchembed = new Discord.RichEmbed()
                    .setAuthor(`Evidence For Case ${caseid}`)
                    .setImage(element.url)
                    .setFooter(`AEGIS-NEW-EVIDENCE Command | Case ID: ${caseid}`);
                message.channel.send(`New evidence uploaded for Case ID **${caseid}**`, {embed: attatchembed});
            });   
        }else{
            return message.reply("I could not find the image. Make sure it is a direct upload NOT a url.");
        }
    }
};