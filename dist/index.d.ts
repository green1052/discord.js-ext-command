import { Client as DiscordClient, ClientOptions as DiscordClientOptions, CommandInteraction, Message, PermissionResolvable, SlashCommandBuilder } from "discord.js";
interface BaseCommand {
    cooldown?: number;
}
export interface InteractionCommand extends BaseCommand {
    data: SlashCommandBuilder;
    guildId?: string;
    execute(interaction: CommandInteraction): void | Promise<void>;
}
export interface TextCommand extends BaseCommand {
    name: string;
    alias?: string[];
    description?: string;
    args?: number;
    userPermissions?: PermissionResolvable[];
    botPermissions?: PermissionResolvable[];
    allowBot?: boolean;
    execute(message: Message, args?: string[]): void | Promise<void>;
}
export declare function Command(target: any): void;
export interface ClientOptions {
    prefix: string;
    globalCooldown?: number;
    /** not working yet */
    useDecorator?: boolean;
    commandCooldownMessage?: string;
    globalCooldownMessage?: string;
    commandNotFoundMessage?: string;
    noBotPermissionMessage?: string;
    noUserPermissionMessage?: string;
    noArgsMessage?: string;
}
export declare class Client extends DiscordClient {
    readonly clientOptions: ClientOptions;
    private readonly commandCooldown;
    private readonly globalCooldown;
    constructor(clientOptions: ClientOptions, options: DiscordClientOptions);
}
declare const _default: {
    Command: typeof Command;
    Client: typeof Client;
};
export default _default;
