# discord.js-ext-command

discord.js-ext-command is command handler for [discord.js](https://github.com/discordjs/discord.js/)

## Installation

[discord.js](https://github.com/discordjs/discord.js/) 13.1.0 or newer is required.

```
npm install discord.js-ext-command
```

## Example

Text:

```typescript
import {Command, DiscordCommand, DiscordCommandArgs, DiscordCommands} from "discord.js-ext-command";
import {Intents} from "discord.js";

const client = new DiscordCommands("prefix", {
    intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES]
});

client.login("token");

@Command
class HelloWorldCommand implements DiscordCommand {
    public name = "hello";

    public run(arg: DiscordCommandArgs) {
        arg.message.channel.send("world!");
    }
}
```

Slash Command:

```typescript
import {REST} from "@discordjs/rest";
import {Routes} from "discord-api-types/v9";
import {DiscordInteractionCommand, DiscordInteractionCommandArgs, InteractionCommand} from "discord.js-ext-command";

const commands = [{
    name: "hello",
    description: "print hello world"
}];

const rest = new REST({version: "9"}).setToken("token");

rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {body: commands});

@InteractionCommand
class HelloWorldCommand implements DiscordInteractionCommand {
    public name = "hello";

    public run(arg: DiscordInteractionCommandArgs) {
        arg.interaction.reply("world");
    }
}
```

[more function](https://github.com/asdf8965/discord.js-ext-command/blob/master/src/DiscordCommand.ts#L3)