import { RESTPostAPIApplicationCommandsJSONBody } from "discord-api-types/v10";

export interface Command {
    data: RESTPostAPIApplicationCommandsJSONBody,
    execute: Function
}