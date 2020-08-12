# Log Channels
> Log Channels are the home of Aegis's Event and Command logs on your server.

## Defaults

Assuming Aegis has the MANAGE_MESSAGES permission, the default channel will be created manually if it doesn't exist. This is the *#log-channel* channel.

## Configuring Log Channels

Using the config command `a!configure`, you can change the place that logs point to.

### Usage:

`a!configure logchannel <channeltype> <channelid>` or `a!cfg -lc <channeltype> <channelid>`

### Configurable Log Channels

| Log Channel | Description                                                                                                                                                                                                   |
|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| default     | The default channel, and fallback in case you don't have the others configured.  This channel must remain set and valid for most commands to work.  This is also the channel that edit and delete logs go to. |
| moderation  | If enabled, all kick, ban, warn and mute logs will go here.                                                                                                                                                   |
| migration   | User join and leave logs.                                                                                                                                                                                     |
| suggestions | User-made server suggestions, if enabled, go here.                                                                                                                                                            |
| voice       | User voice channel joins, leaves and moves are logged here.                                                                                                                                                   |