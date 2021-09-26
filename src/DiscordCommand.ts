import {Client, ClientOptions, Message, PermissionString} from "discord.js";

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
    client: Client;
    message: Message;
    args: any[];
}

export interface CommandInfo {
    name: string,
    command: DiscordCommand
}

const commandList: CommandInfo[] = [];

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

export class DiscordCommands extends Client {
    constructor(prefix: string, options: ClientOptions) {
        super(options);

        super.on("messageCreate", message => {
            if (!commandList.length)
                return;

            if (!message.content.startsWith(prefix))
                return;

            const args = message.content.substring(prefix.length).split(" ");

            if (!args.length)
                return;

            const command = args.shift()!;

            const target = commandList.find(a => a.name === command || a.command.alias?.includes(command));

            if (target === undefined)
                return;

            if (target.command.bot === false && message.author.bot)
                return;

            if (target.command.userPermissions !== undefined &&
                !message.member?.permissions.has(target.command.userPermissions))
                return;

            if (target.command.botPermissions !== undefined &&
                !message.member?.permissions.has(target.command.botPermissions))
                return;

            target.command.run({
                client: message.client,
                message: message,
                args: args
            });
        });
    }

    public get Commands(): CommandInfo[] {
        return commandList;
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
}