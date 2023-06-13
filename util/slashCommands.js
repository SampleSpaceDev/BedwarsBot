"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommands = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logging_1 = __importDefault(require("./logging"));
function getCommands() {
    const commands = [];
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path_1.default.resolve("commands");
    const commandFiles = fs_1.default.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
        const filePath = path_1.default.join(commandsPath, file);
        import(filePath)
            .then((commandModule) => {
            const command = commandModule.default.default;
            if (!command)
                return;
            if ('data' in command && 'execute' in command) {
                commands.push(command.data);
            }
            else {
                logging_1.default.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
            logging_1.default.debug(`${command.data.name} was registered.`);
        })
            .catch((error) => {
            logging_1.default.error(`Failed to import command module at ${filePath}:`, error);
        });
    }
    return commands;
}
exports.getCommands = getCommands;
