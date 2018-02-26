module.exports = {
    name: "ping",
    description: "Test bot awareness",
    alias: "p",
    execute(message, args) {
        message.channel.send("Pong!");
    }
};