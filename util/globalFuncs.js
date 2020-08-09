exports.getLogChannel = async (guild, type) => {
    const main = require("../aegis.js");
    const guilddb = main.sendGuildDB();
    var logchannel
    await guilddb.findOne({where:{guildid : guild.id}}).then(row =>{
        var config = row.config;
        logchannel = guild.channels.cache.get(config.logchannels[type]);
        if(!logchannel){
            logchannel = guild.channels.cache.get(config.logchannels.default);
            if(!logchannel){
                return null;
            }
        }
    });
    return logchannel;
}

exports.getGuildConfig = async (guildid) =>{
    const main = require("../aegis.js");
    const guilddb = main.sendGuildDB();
    var config;
    await guilddb.findOne({where:{guildid : guildid}}).then(row =>{
        config = row.config;
    });
    return config;
}

exports.makeID = () => {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXY0123456789";
  
    for (var i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}