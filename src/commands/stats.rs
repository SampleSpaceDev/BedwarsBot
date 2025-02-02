use crate::services::hypixel::HypixelService;
use crate::services::minecraft::PlayerDBService;
use crate::{Context, Error};

#[poise::command(slash_command, prefix_command)]
pub async fn run(
    ctx: Context<'_>,
    username: String
) -> Result<(), Error> {

    let minecraft = PlayerDBService::instance();
    let player = minecraft.get_player_data(&username.clone()).await?;

    let hypixel = HypixelService::instance();
    let data = match hypixel.get_player_data(&player.id).await {
        Ok(data) => data,
        Err(e) => {
            ctx.say(format!("Failed to fetch Hypixel data: {}", e)).await?;
            return Ok(());
        }
    };

    let bedwars = data.stats.bedwars;
    
    ctx.say(format!("{} has {} experience", player.username, bedwars.experience)).await?;

    Ok(())
}