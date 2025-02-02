mod commands;
mod canvas;
mod services;
mod types;

use poise::builtins::register_in_guild;
use poise::serenity_prelude::GatewayIntents;
use poise::{Framework, FrameworkOptions};
use serenity::all::{ClientBuilder, GuildId, Ready};
use serenity::async_trait;
use serenity::client::EventHandler;
use tracing::info;
use crate::commands::stats;

struct Data {}
struct Handler;

type Error = Box<dyn std::error::Error + Send + Sync>;
type Context<'a> = poise::Context<'a, Data, Error>;

#[async_trait]
impl EventHandler for Handler {
    async fn ready(&self, _ctx: serenity::all::Context, data: Ready) {
        info!("Connected as {}", data.user.name);
    }
}

#[tokio::main]
async fn main() {
    dotenv::dotenv().expect("Failed to read .env file");

    tracing_subscriber::fmt::init();

    let token = dotenv::var("DISCORD_TOKEN").expect("Missing Discord token");
    let intents = GatewayIntents::GUILDS | GatewayIntents::DIRECT_MESSAGES;

    let commands: Vec<poise::Command<Data, Error>> = vec![stats::run()];

    let framework = Framework::builder()
        .options(FrameworkOptions {
            commands,
            ..Default::default()
        })
        .setup(|ctx, _ready, framework| {
            Box::pin(async move {
                register_in_guild(ctx, &framework.options().commands, GuildId::new(1055185265909583932)).await?;
                Ok(Data {})
            })
        })
        .build();

    let client = ClientBuilder::new(&token, intents)
        .framework(framework)
        .event_handler(Handler)
        .await;

    client.unwrap().start_autosharded().await.expect("Bot failed to start");
}
