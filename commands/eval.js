module.exports= {
    name: "eval",
    description: "Evaluates basic code.",
    alias: ["evaluate", "test"],
    usage: "eval <code>",
    permissions: "Only Vex can use this command.",
    async execute(message, args, client, Discord){
        const config = require("../config.json");
        const guild = message.guild;

        if(message.author.id != config.ownerID) return
        function clean(text) {
            if (typeof(text) === "string")
                return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
            else
                return text;
        }
        try {
            var code = args.join(" ");
            var evaled = eval(code);

            if (typeof evaled !== "string")
                evaled = require("util").inspect(evaled);

            message.channel.send(clean(evaled))
                .then(message=>message.react('✅'));
        } catch (err) {
                message.channel.send(`\`Code execution failed.\` \`\`\`xl\n${clean(err)}\n\`\`\``)
                    .then(message=>message.react('❎'));
        }
    }
}