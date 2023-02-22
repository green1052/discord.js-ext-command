import {
    Client as DiscordClient,
    ClientOptions as DiscordClientOptions,
    Collection,
    CommandInteraction,
    Events,
    Message,
    PermissionResolvable,
    REST,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    Routes,
    SlashCommandBuilder
} from "discord.js";

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

export function Command(target: any) {
    const command = new target();

    if (command.data !== undefined) {
        interactionCommandList.set(command.data.name, command);
    } else if (command.name !== undefined) {
        textCommandList.set(command.name, command);
    } else {
        throw new Error();
    }
}

const textCommandList = new Collection<string, TextCommand>();
const interactionCommandList = new Collection<string, InteractionCommand>();

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

export class Client extends DiscordClient {
    public readonly clientOptions: ClientOptions;

    private readonly commandCooldown = new Collection<string, Collection<string, number>>();
    private readonly globalCooldown = new Collection<string, number>();

    constructor(clientOptions: ClientOptions, options: DiscordClientOptions) {
        super(options);

        super.on(Events.ClientReady, async (client) => {
            if (textCommandList.size === 0 && interactionCommandList.size === 0) return;

            const rest = new REST({version: "10"}).setToken(client.token);

            const global: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
            const guild: { [key: string]: RESTPostAPIChatInputApplicationCommandsJSONBody[] } = {};

            interactionCommandList.forEach(command => {
                if (command.guildId === undefined) {
                    global.push(command.data.toJSON());
                    return;
                }

                guild[command.guildId] ??= [];
                guild[command.guildId].push(command.data.toJSON());
            });

            if (global.length > 0) {
                await rest.put(
                    Routes.applicationCommands(client.user.id),
                    {body: global}
                );
            }

            for (const [key, value] of Object.entries(guild)) {
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, key),
                    {body: value}
                );
            }
        });

        super.on(Events.MessageCreate, async (message) => {
            if (!message.content.startsWith(this.clientOptions.prefix)) return;

            const args = message.content.slice(this.clientOptions.prefix.length).trimStart().split(" ");

            const cmd = args.shift();

            if (cmd === undefined) return;

            const command = textCommandList.find(command => command.name === cmd || command.alias?.includes(cmd));

            if (command === undefined) {
                if (this.clientOptions.commandNotFoundMessage !== undefined) {
                    // @ts-ignore
                    message.channel.send(this.clientOptions.commandNotFoundMessage);
                }

                return;
            }

            if (command.args !== undefined && command.args > args.length) {
                if (this.clientOptions.noArgsMessage !== undefined) {
                    // @ts-ignore
                    message.channel.send(this.clientOptions.noArgsMessage);
                }

                return;
            }

            if (command.allowBot === false && message.author.bot) return;

            if (message.guild !== undefined) {
                if (command.botPermissions !== undefined && !command.botPermissions.every(permission => message.guild!.members.me!.permissions.has(permission))) {
                    if (this.clientOptions.noBotPermissionMessage !== undefined) {
                        // @ts-ignore
                        message.channel.send(this.clientOptions.noBotPermissionMessage);
                    }

                    return;
                }

                if (command.userPermissions !== undefined && !command.userPermissions.every(permission => message.member!.permissions.has(permission))) {
                    if (this.clientOptions.noUserPermissionMessage !== undefined) {
                        // @ts-ignore
                        message.channel.send(this.clientOptions.noUserPermissionMessage);
                    }

                    return;
                }
            }

            if (this.clientOptions.globalCooldown !== undefined) {
                const now = Date.now();

                if (!this.globalCooldown.has(message.author.id))
                    this.globalCooldown.set(message.author.id, now);

                const cooldown = this.globalCooldown.get(message.author.id)!;

                const expirationTime = cooldown + this.clientOptions.globalCooldown;

                if (now < expirationTime) {
                    if (this.clientOptions.globalCooldownMessage !== undefined) {
                        // @ts-ignore
                        message.channel.send(this.clientOptions.globalCooldownMessage);
                    }

                    return;
                } else {
                    this.globalCooldown.delete(message.author.id);
                }
            }

            if (command.cooldown !== undefined) {
                const now = Date.now();

                if (!this.commandCooldown.has(command.name))
                    this.commandCooldown.set(command.name, new Collection());

                const cooldown = this.commandCooldown.get(command.name)!;

                if (cooldown.has(message.author.id)) {
                    const expirationTime = cooldown.get(message.author.id)! + command.cooldown;

                    if (now < expirationTime) {
                        if (this.clientOptions.commandCooldownMessage !== undefined) {
                            // @ts-ignore
                            message.channel.send(this.clientOptions.commandCooldownMessage);
                        }

                        return;
                    } else {
                        this.commandCooldown.get(command.name)!.delete(message.author.id);
                    }
                } else {
                    this.commandCooldown.get(command.name)!.set(message.author.id, now);
                }
            }

            command.execute(message, args);
        });

        super.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;

            const command = interactionCommandList.get(interaction.commandName)!;

            command.execute(interaction);
        });

        this.clientOptions = clientOptions;
    }
}

export default {
    Command,
    Client
};