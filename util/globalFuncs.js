exports.getLogChannel = (guild, type) => {
    const main = require("../aegis.js");
    const guilddb = main.sendGuildDB();
    console.log(guilddb)
    guilddb.findOne({where:{guildid : guild.id}}).then(row =>{
        console.log(row)
        var config = row.config;
        var logchannel = guild.channels.cache.get(config.logchannels[type]);
        if(!logchannel){
            logchannel = guild.channels.cache.get(config.logchannels.default);
            if(!logchannel){
                return null;
            }
        }
        return logchannel;
    });
}
