# discord.js-ext-command

discord.js-ext-command is command handler for [discord.js](https://github.com/discordjs/discord.js/)

## Installation

[discord.js](https://github.com/discordjs/discord.js/) 13.1.0 or newer is required.

```
npm install discord.js-ext-command
```

## Example

```typescript
import {DiscordCommands, Command, DiscordCommand, DiscordCommandArgs} from "discord.js-ext-command";
import {Intents} from "discord.js";

const prefix = "!";

const client = new DiscordCommands(prefix, {
    intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES]
});

const token = "input your token";

client.login(token);

@Command
class HelloWorldCommand implements DiscordCommand {
    public name = "hello";

    public run(arg: DiscordCommandArgs) {
        arg.message.channel.send("world!");
    }
}
```

[more function](https://github.com/asdf8965/discord.js-ext-command/blob/master/src/DiscordCommand.ts#L3)