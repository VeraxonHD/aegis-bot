# Filters
> Filters are a set of configurable anti-spam filters that can be enabled and disabled as you wish.

## Configuring Filters

Using the config command `a!configure`, you can change the settings of the filters module.

### Usage:

`a!configure filters <filter> [data]` or `a!cfg -f <filter> [data]`

### Filter Modules

| Module         | Description                                                                                                                                                | Requires [data]?                                                               | [data]  |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|---------|
| discordInvites | Whether or not to block Discord Invites                                                                                                                    | No. This command uses a boolean which is toggled automatically upon execution. |         |
| repeatMessages | Whether or not to delete quick-sent message chains. The system will apply an auto-warning after 4 messages. The system will ban the user after 7 messages. | No. This command uses a boolean which is toggled automatically upon execution. |         |
| exempt         | Add a userID, making them exempt from                                                                                                                      | Yes.                                                                           | UserID  |

