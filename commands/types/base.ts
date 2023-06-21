import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";

export class Command {
    data: RESTPostAPIApplicationCommandsJSONBody;
    execute: Function;
    autocomplete?: Function;
    isDev?: boolean;
}