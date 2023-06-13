"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@discordjs/rest");
const ws_1 = require("@discordjs/ws");
const core_1 = require("@discordjs/core");
const logging_1 = __importDefault(require("./util/logging"));
const slashCommands_1 = require("./util/slashCommands");
const config = __importStar(require("./config.json"));
const rest = new rest_1.REST({ version: '10' }).setToken(config.token);
const gateway = new ws_1.WebSocketManager({
    token: config.token,
    intents: core_1.GatewayIntentBits.Guilds | core_1.GatewayIntentBits.MessageContent,
    rest
});
const client = new core_1.Client({ rest, gateway });
const slashCommandApi = new core_1.ApplicationCommandsAPI(rest);
slashCommandApi.bulkOverwriteGuildCommands(config.appId, config.guildId, (0, slashCommands_1.getCommands)());
client.once(core_1.GatewayDispatchEvents.Ready, () => {
    logging_1.default.info("Client online.");
});
client.on(core_1.GatewayDispatchEvents.InteractionCreate, async ({ data: interaction, api }) => {
    if (interaction.type !== core_1.InteractionType.ApplicationCommand || interaction.data.name !== 'ping') {
        return;
    }
    await api.interactions.reply(interaction.id, interaction.token, { content: 'Pong!', flags: core_1.MessageFlags.Ephemeral });
});
gateway.connect();
