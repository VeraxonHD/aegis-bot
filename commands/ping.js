module.exports = {
    name: "ping",
    description: "Test bot awareness",
    alias: ["p", "latency"],
    usage: "ping",
    permissions: "NONE",
    async execute(message, args) {
        message.channel.send("Pong!");
    }
};