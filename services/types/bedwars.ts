export class Bedwars {
    games_played_bedwars: number;
    Experience: number;

    kills_bedwars: number;
    deaths_bedwars: number;
    public kd_ratio = () => this.kills_bedwars / this.deaths_bedwars;

    final_kills_bedwars: number;
    final_deaths_bedwars: number;
    final_kd_ratio = () => this.kills_bedwars / this.deaths_bedwars;

    beds_broken_bedwars: number;
    beds_lost_bedwars: number;
    beds_ratio = () => this.beds_broken_bedwars / this.beds_lost_bedwars;

    diamond_resources_collected_bedwars: number;
    emerald_resources_collected_bedwars: number;
    gold_resources_collected_bedwars: number;
    iron_resources_collected_bedwars: number;
}