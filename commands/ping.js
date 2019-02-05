module.exports = {
    name: "ping",
    description: "Test bot awareness",
    alias: ["p", "latency"],
    usgae: "ping",
    permissions: "NONE",
    execute(message, args) {
        message.channel.send("Pong!");
    }
};