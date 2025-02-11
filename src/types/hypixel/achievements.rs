use serde::Deserialize;

#[derive(Deserialize, Debug, Clone, Default)]
pub struct HypixelAchievements {
    pub bedwars_level: i32,
}