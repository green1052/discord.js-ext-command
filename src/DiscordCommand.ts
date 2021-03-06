import {Client, ClientOptions, CommandInteraction, Message, PermissionString} from "discord.js";

// Text
export interface DiscordCommand {
    name: string;
    alias?: string[];
    description?: string;
    bot?: boolean;
    userPermissions?: PermissionString[];
    botPermissions?: PermissionString[];

    run(arg?: DiscordCommandArgs): any | Promise<any>;
}

export interface DiscordCommandArgs {
    message: Message;
    args: any[];
}

export interface CommandInfo {
    name: string;
    command: DiscordCommand;
}

export function Command(target: any) {
    const command: DiscordCommand = new target();

    if (command.name === undefined)
        throw "name is null!";

    if (command.run === undefined)
        throw "run is null!";

    commandList.push({
        name: command.name,
        command: command
    });
}

const commandList: CommandInfo[] = [];
// Text end

// Interaction
export interface DiscordInteractionCommand {
    name: string;
    bot?: boolean;

    run(arg?: DiscordInteractionCommandArgs): any | Promise<any>;
}

export interface DiscordInteractionCommandArgs {
    interaction: CommandInteraction;
}

export interface InteractionCommandInfo {
    name: string;
    command: DiscordInteractionCommand;
}

export function InteractionCommand(target: any) {
    const command: DiscordInteractionCommand = new target();

    if (command.name === undefined)
        throw "name is null!";

    if (command.run === undefined)
        throw "run is null!";

    interactionCommandList.push({
        name: command.name,
        command: command
    });
}

const interactionCommandList: InteractionCommandInfo[] = [];
// Interaction end

export class DiscordCommands extends Client {
    constructor(prefix: string, options: ClientOptions) {
        super(options);

        super.on("interactionCreate", async interaction => {
            if (!interactionCommandList.length)
                return;

            if (!interaction.isCommand())
                return;

            const command = this.GetInteractionCommand(interaction.commandName);

            if (!command)
                return;

            if (command.command.bot === false && interaction.member?.user.bot)
                return;

            command.command.run({
                interaction: interaction
            });
        });

        super.on("messageCreate", message => {
            if (!commandList.length)
                return;

            if (!message.content.startsWith(prefix))
                return;

            const args = message.content.substring(prefix.length).split(" ");

            if (!args.length)
                return;

            const command = args.shift()!;

            const target = this.GetCommand(command);

            if (target === undefined)
                return;

            if (target.command.bot === false && message.author.bot)
                return;

            if (target.command.userPermissions !== undefined &&
                !message.member?.permissions.has(target.command.userPermissions))
                return;

            if (target.command.botPermissions !== undefined &&
                !message.guild?.me?.permissions.has(target.command.botPermissions))
                return;

            target.command.run({
                message: message,
                args: args
            });
        });
    }

    public get Commands(): CommandInfo[] {
        return commandList;
    }

    public get InteractionCommands(): InteractionCommandInfo[] {
        return interactionCommandList;
    }

    public GetCommand(name: string, alias: boolean = true): CommandInfo | undefined {
        return this.Commands.find(command => command.name === name || alias && command.command.alias?.includes(name));
    }

    public RemoveCommand(name: string): boolean {
        const command = this.GetCommand(name);

        if (command === undefined)
            return false;

        delete commandList[commandList.indexOf(command)];
        return true;
    }

    public GetInteractionCommand(name: string): InteractionCommandInfo | undefined {
        return this.InteractionCommands.find(command => command.name === name);
    }

    public RemoveInteractionCommand(name: string): boolean {
        const command = this.GetInteractionCommand(name);

        if (command === undefined)
            return false;

        delete interactionCommandList[interactionCommandList.indexOf(command)];
        return true;
    }
}
