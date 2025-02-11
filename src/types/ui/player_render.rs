use std::time::Duration;
use reqwest::Client;
use tracing::{debug, error};

#[derive(Debug, PartialEq)]
pub enum PlayerType {
    Head,
    Body,
    Full,
    Bust,
}

pub struct PlayerOptions {
    pub player_type: PlayerType,
    pub rotation: Option<f32>,
    pub yaw: Option<f32>,
    pub pitch: Option<f32>,
    pub size: Option<f32>,
}

impl Default for PlayerOptions {
    fn default() -> Self {
        PlayerOptions {
            player_type: PlayerType::Full,
            rotation: None,
            yaw: None,
            pitch: None,
            size: None,
        }
    }
}

pub fn create_url(id: &str, options: PlayerOptions) -> String {
    let mut rotations = Vec::new();
    if let Some(rotation) = options.rotation {
        rotations.push(format!("r={}", rotation));
    }
    if let Some(yaw) = options.yaw {
        rotations.push(format!("y={}", yaw));
    }
    if let Some(pitch) = options.pitch {
        rotations.push(format!("p={}", pitch));
    }

    let type_str = match options.player_type {
        PlayerType::Head => "head",
        PlayerType::Body => "body",
        PlayerType::Full => "full",
        PlayerType::Bust => "bust",
    };

    let mut image_url = format!("https://visage.surgeplay.com/{type_str}");

    if let Some(size) = options.size {
        image_url.push_str(&format!("/{size}"));
    }

    image_url.push_str(&format!("/{id}.png"));

    if !rotations.is_empty() {
        image_url.push('?');
        image_url.push_str(&rotations.join("&"));
    }

    debug!("Generated image URL: {}", image_url);
    
    image_url
}

pub async fn url_to_buffer(image_url: &str) -> Vec<u8> {
    let client = Client::new();
    let response = client
        .get(image_url)
        .header("User-Agent", "Mango v2.0")
        .timeout(Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| {
            error!("Error downloading the image: {:?}", e);
            e
        });

    let bytes = response.expect("REASON").bytes().await.map_err(|e| {
        error!("Error reading response bytes: {:?}", e);
        e
    });

    bytes.unwrap().to_vec()
}