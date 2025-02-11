use once_cell::sync::Lazy;
use crate::types::utils::load_image;

pub static IRON_INGOT: Lazy<Vec<u8>> = Lazy::new(|| load_image("assets/images/iron_ingot.png"));
pub static GOLD_INGOT: Lazy<Vec<u8>> = Lazy::new(|| load_image("assets/images/gold_ingot.png"));
pub static DIAMOND: Lazy<Vec<u8>> = Lazy::new(|| load_image("assets/images/diamond.png"));
pub static EMERALD: Lazy<Vec<u8>> = Lazy::new(|| load_image("assets/images/emerald.png"));