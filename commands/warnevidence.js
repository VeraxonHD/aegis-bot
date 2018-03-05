module.exports = {
    name: "warnevidence",
    description: "Post-humously add warn evidence via Case ID",
    alias: ["we", "warnedit"],
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
                    .setFooter(`AEGIS-WARN-EVIDENCE Event | Case ID: ${caseid}`);
                message.channel.send(`Warning evidence updated for Case ID **${caseid}**`, {embed: attatchembed});
            });   
        }else{
            return message.reply("I could not find the image. Make sure it is a direct upload NOT a url.");
        }
    }
};