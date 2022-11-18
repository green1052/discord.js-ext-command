# discord.js-ext-command

discord.js-ext-command is command handler for [discord.js](https://github.com/discordjs/discord.js/)

## Installation

[discord.js](https://github.com/discordjs/discord.js/) 14.0.0 or newer is required.

```
npm install git+https://github.com/green1052/discord.js-ext-command#[tag]
yarn add git+https://github.com/green1052/discord.js-ext-command#[tag]
```

## Example

Text Command:

```typescript
import {Command, Client, TextCommand} from "discord.js-ext-command";
import {CommandInteraction, GatewayIntentBits, Message, SlashCommandBuilder} from "discord.js";

const client = new DiscordCommands({
    prefix: "!"
}, {
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.login("token");

@Command
class HelloWorldCommand implements TextCommand {
    public name = "hello";
    public args = 1;

    public execute(message: Message, args: string[]) {
        message.channel.send(`hello ${args[0]}!`);
    }
}
```

Slash Command:

```typescript
import {Command, Client, InteractionCommand} from "discord.js-ext-command";
import {CommandInteraction, GatewayIntentBits, SlashCommandBuilder} from "discord.js";

const client = new DiscordCommands({
    prefix: "!"
}, {
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.login("token");

@Command
class HelloWorldCommand implements InteractionCommand {
    data = new SlashCommandBuilder()
        .setName("test")
        .setDescription("test")

    execute(interaction: CommandInteraction) {
        interaction.reply({
            content: "test"
        });
    }
}
```
