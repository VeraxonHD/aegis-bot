module.exports = {
    name: "tag",
    description: "Custom command handling",
    alias: ["cc", "custcom"],
    usage: "tag [name|create|delete|list] (create/delete)[name] (create)[content]",
    permissions: "(create/delete)[MANAGE_MESSAGES] (view/list)[NONE]",
    execute(message, args, Tags) {
        var cmdType = args[0];
        var mainFile = require("../aegis.js")
        if(cmdType == "create"){
            if(!args[1]){
                return message.reply("Please define a (unique) tag name.");
            }else if(!args[2]){
                return message.reply("Please give this tag some content.");
            }else{
                try{
                    mainFile.dbEntry_Tags(args[1], args[2], message.author.id)
                    return message.reply("Tag created successfully")
                }catch(e){
                    console.log(e)
                    return message.reply("Error Creating Tag.")
                }
            }
        }else if(cmdType == "delete"){

        }else if(cmdType == "list"){

        }else{

        }
    }
};