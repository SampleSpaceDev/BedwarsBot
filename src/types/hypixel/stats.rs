use serde::Deserialize;
use crate::types::hypixel::bedwars::HypixelBedwars;

#[derive(Clone, Deserialize, Debug)]
pub struct HypixelStats {
    #[serde(rename = "Bedwars")]
    pub bedwars: HypixelBedwars,
}