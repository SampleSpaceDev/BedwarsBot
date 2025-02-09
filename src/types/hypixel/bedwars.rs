use serde::Deserialize;

#[derive(Clone, Deserialize, Debug)]
pub struct HypixelBedwars {
    #[serde(rename = "Experience")]
    pub experience: u32,
}

impl HypixelBedwars {
    
    pub fn calculate_star(&self) {
        
    }
}