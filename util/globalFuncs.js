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

exports.addWarn = async (userid, guildid) =>{
    const main = require("../aegis.js");
    const GuildDB = main.sendGuildDB();
    const UserDB = main.sendUserDB();
    var gSuccess = false;
    var uSuccess = false;

    await GuildDB.findOne({where:{guildid: guildid}}).then(async gData =>{
        gData.members[userid].warnings++;
        await GuildDB.update({members: gData.members}, {where:{guildid: guildid}}).then(()=>{
            gSuccess = true;
        })
    });
    await UserDB.findOne({where:{userid: userid}}).then(async uData =>{
        uData.globalWarnings++;
        await UserDB.update({globalWarnings: uData.globalWarnings}, {where:{userid: userid}}).then(()=>{
            uSuccess = true;
        })
    });

    if(gSuccess && uSuccess){
        return true;
    }else{
        return false;
    }
};