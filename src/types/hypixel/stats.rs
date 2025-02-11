use serde::Deserialize;
use crate::types::hypixel::bedwars::HypixelBedwars;

#[derive(Clone, Deserialize, Debug, Default)]
pub struct HypixelStats {
    #[serde(rename = "Bedwars")]
    pub bedwars: HypixelBedwars,
}