import { mongo } from "../services";
import { LinkedPlayer } from "../services/types";
import { Duration, Moment } from "moment";
import { CanvasWrapper } from "./canvas";

export type RemoveMethods<T> = Pick<
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  { [Key in keyof T]: T[Key] extends Function ? never : Key }[keyof T]
>;


export const ratio = (a: number, b: number): string => (a === 0 && b === 0 ? "0" : (a / Math.max(1, b)).toFixed(2));

export const stripColor = (string: string) => string.replace(/<\/?[^>]+(>|$)|<#[^>]+(>|$)/g, "");

export async function getPlayer(discordId: string): Promise<string> {
    const players = await mongo.getCollection<LinkedPlayer>("players");
    const found = await players.find({
        id: discordId
    }).toArray();

    return found[0]?.uuid || undefined;
}

export const randomId = () => Math.random().toString(16).substring(2, 9);

export const formatTime = (duration: Duration) => {
    const units = ['y', 'mo', 'w', 'd', 'h', 'm'];
    const values = [duration.years(), duration.months(), duration.weeks(), duration.days(), duration.hours(), duration.minutes()];

    return units.reduce((result, unit, index) => {
        if (values[index] >= 1) {
            result += `${values[index]}${unit} `;
        }
        return result;
    }, '').trim();
}

export const formatDate = (moment: Moment, time: boolean = true) => time ? moment.format('MMM Do YYYY, h:mm:ss a') : moment.format('MMM Do YYYY');

export const f = (number: number) => Math.round(number).toLocaleString();

export const truncate = (wrapper: CanvasWrapper, text: string, maxLength: number) => {
    const ellipsis = "...";
    const maxTextWidth = maxLength - wrapper.measure(ellipsis);

    const truncatedText = Array.from(text).reduce((result, char) => {
        const charWidth = wrapper.measure(char);
        const width = wrapper.measure(result);

        return width + charWidth <= maxTextWidth ? result + char : result;
    }, "");

    return truncatedText + ellipsis;
}