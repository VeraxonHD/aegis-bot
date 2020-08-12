# Events
> Events are essentially the logging of data. They include edited and deleted messages, joining and leaving users and more.

## Configuring Events

Using the config command `a!configure`, you can change the settings of the events module.

### Usage:

`a!configure disabledLogs <event>` or `a!cfg -dl <event>`

### Valid Events

| Event             | Description                                                                                                                                       |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| messageDelete     | Run when a message is deleted.                                                                                                                    |
| messageUpdate     | Run when a message's content is edited.                                                                                                           |
| messageDeleteBulk | Run when a bulk amount of messages are deleted. This occurs when a member is banned and their messages are pruned, or the a!prune command is run. |
| voiceStatusUpdate | Run when a user joins, changes and/or leaves a voice channel.                                                                                     |
| guildMemberAdd    | Run when a user joins the guild.                                                                                                                  |
| guildMemberRemove | Run when a user leaves the guild.                                                                                                                 |