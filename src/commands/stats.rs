use crate::canvas::Canvas;
use crate::services::hypixel::HypixelService;
use crate::services::minecraft::PlayerDBService;
use crate::{Context, Error};
use poise::CreateReply;
use serenity::all::CreateAttachment;

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

    let bedwars = &data.stats.bedwars;
    
    let image_data = {
        let mut canvas = Canvas::new(500, 500);
        canvas.draw_image("assets/bedwars/apollo.png", 0.0, 0.0, 500.0, 500.0);
        
        canvas.draw_text(format!("{} {}", &data.rank_formatted(), &data.displayname).as_str(), 100.0, 200.0, 32.0, true);
        
        canvas.data()
    };
    
    let attachment = CreateAttachment::bytes(image_data.as_bytes(), "image.png");
    
    ctx.send(CreateReply::default().attachment(attachment)).await?;

    Ok(())
}