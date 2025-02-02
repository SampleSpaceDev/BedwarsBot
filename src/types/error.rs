use std::error::Error;
use std::fmt;
use std::fmt::{Display, Formatter};

// Define a custom error type
#[derive(Debug)]
pub struct MinecraftError(pub String);

impl Display for MinecraftError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Error for MinecraftError {}

impl From<reqwest::Error> for MinecraftError {
    fn from(err: reqwest::Error) -> Self {
        MinecraftError(format!("Request error: {}", err))
    }
}

impl From<serde_json::Error> for MinecraftError {
    fn from(err: serde_json::Error) -> Self {
        MinecraftError(format!("JSON parse error: {}", err))
    }
}