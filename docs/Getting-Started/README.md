# Adding Aegis to your Guild

> **Adding Aegis is remarkably simple - just go to [This Link](https://discord.com/oauth2/authorize?client_id=416349322620305408&scope=bot&permissions=415755351) and accept the permissions.**

## Permissions Breakdown

Some people want to know exactly why Aegis requests the permissions it does. If you're one of those people, which I respect for thinking about Security first, read on!

### Manage Roles

Aegis needs Manage Roles permissions to assign roles to members, for example the mute role, as well as all react-role assignments and un-assignments.

### Manage Channels

Aegis needs the ability to create and delete messages, crucially for the Party system, creating a log channel on first join, and creating, moving and deleting Modmail channels in the near future.

### Kick/Ban Members

Aegis lets you manage kicks and bans by putting them under one command roof. This means that, if you use the kick and ban commands, Aegis needs the ability to actually carry out those sentences.

### Create Instant Invite

In the future I intend to be able to see what servers Aegis is in, so that I can provide direct setup and debug support. Having Aegis create invites for me allows me to join your server and help you out, should you need it.

### Manage Nicknames

This is a future plan for Aegis - to be able to detect offensive nicknames and automatically censor them.

### Read, Send and Manage Messages, and Read Message History

Aegis needs the ability to read and send messages to respond to commands. Manage Messages gives Aegis to delete and pin messages, but the former is the more important. Aegis can then delete messages that violate spam or content filters, as well as delete its own messages when it needs to.

### Embed Links and Attach Files

Aegis needs to be able to embed links and attach files. The former is for using Rich Message Embeds, the style of message that Aegis uses for logs. It also allows Aegis to upload images and especially text files for the upcoming Modmail overhaul.

### Mention @here, @everyone and All Roles

This is for the Announce function. Aegis will not mis-use (or even use) the @here, @everyone and All Roles permission unless you tell it to.

### Use External Emojis and Add Reactions

This is for the Reaction Role system, to be able to add the emojis to messages required for that system to work.

### View Voice Channels, Mute and Deafen members.

This isn't strictly required, however it helps me map out what voice channels are available. Aegis might also need the ability to mute and deafen members in the future, but you can most likely turn the last two off if you really want to. I advise against it, though.