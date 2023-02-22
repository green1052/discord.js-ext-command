"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.Command = void 0;
const discord_js_1 = require("discord.js");
function Command(target) {
    const command = new target();
    if (command.data !== undefined) {
        interactionCommandList.set(command.data.name, command);
    }
    else if (command.name !== undefined) {
        textCommandList.set(command.name, command);
    }
    else {
        throw new Error();
    }
}
exports.Command = Command;
const textCommandList = new discord_js_1.Collection();
const interactionCommandList = new discord_js_1.Collection();
class Client extends discord_js_1.Client {
    clientOptions;
    commandCooldown = new discord_js_1.Collection();
    globalCooldown = new discord_js_1.Collection();
    constructor(clientOptions, options) {
        super(options);
        super.on(discord_js_1.Events.ClientReady, async (client) => {
            if (textCommandList.size === 0 && interactionCommandList.size === 0)
                return;
            const rest = new discord_js_1.REST({ version: "10" }).setToken(client.token);
            const global = [];
            const guild = {};
            interactionCommandList.forEach(command => {
                if (command.guildId === undefined) {
                    global.push(command.data.toJSON());
                    return;
                }
                guild[command.guildId] ??= [];
                guild[command.guildId].push(command.data.toJSON());
            });
            if (global.length > 0) {
                await rest.put(discord_js_1.Routes.applicationCommands(client.user.id), { body: global });
            }
            for (const [key, value] of Object.entries(guild)) {
                await rest.put(discord_js_1.Routes.applicationGuildCommands(client.user.id, key), { body: value });
            }
        });
        super.on(discord_js_1.Events.MessageCreate, async (message) => {
            if (!message.content.startsWith(this.clientOptions.prefix))
                return;
            const args = message.content.slice(this.clientOptions.prefix.length).trimStart().split(" ");
            const cmd = args.shift();
            if (cmd === undefined)
                return;
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
            if (command.allowBot === false && message.author.bot)
                return;
            if (message.guild !== undefined) {
                if (command.botPermissions !== undefined && !command.botPermissions.every(permission => message.guild.members.me.permissions.has(permission))) {
                    if (this.clientOptions.noBotPermissionMessage !== undefined) {
                        // @ts-ignore
                        message.channel.send(this.clientOptions.noBotPermissionMessage);
                    }
                    return;
                }
                if (command.userPermissions !== undefined && !command.userPermissions.every(permission => message.member.permissions.has(permission))) {
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
                const cooldown = this.globalCooldown.get(message.author.id);
                const expirationTime = cooldown + this.clientOptions.globalCooldown;
                if (now < expirationTime) {
                    if (this.clientOptions.globalCooldownMessage !== undefined) {
                        // @ts-ignore
                        message.channel.send(this.clientOptions.globalCooldownMessage);
                    }
                    return;
                }
                else {
                    this.globalCooldown.delete(message.author.id);
                }
            }
            if (command.cooldown !== undefined) {
                const now = Date.now();
                if (!this.commandCooldown.has(command.name))
                    this.commandCooldown.set(command.name, new discord_js_1.Collection());
                const cooldown = this.commandCooldown.get(command.name);
                if (cooldown.has(message.author.id)) {
                    const expirationTime = cooldown.get(message.author.id) + command.cooldown;
                    if (now < expirationTime) {
                        if (this.clientOptions.commandCooldownMessage !== undefined) {
                            // @ts-ignore
                            message.channel.send(this.clientOptions.commandCooldownMessage);
                        }
                        return;
                    }
                    else {
                        this.commandCooldown.get(command.name).delete(message.author.id);
                    }
                }
                else {
                    this.commandCooldown.get(command.name).set(message.author.id, now);
                }
            }
            command.execute(message, args);
        });
        super.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand())
                return;
            const command = interactionCommandList.get(interaction.commandName);
            command.execute(interaction);
        });
        this.clientOptions = clientOptions;
    }
}
exports.Client = Client;
exports.default = {
    Command,
    Client
};
