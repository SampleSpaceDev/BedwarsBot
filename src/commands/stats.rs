use std::default::Default;
use crate::types::ui::canvas::{Canvas, BACKUP_TYPEFACE};
use crate::services::hypixel::HypixelService;
use crate::services::minecraft::PlayerDBService;
use crate::{Context, Error};
use poise::CreateReply;
use serenity::all::CreateAttachment;
use skia_safe::Color;
use tracing::error;
use crate::types::ui::content_box::{ContentBox, ImageContent, Alignment, TextContent, VerticalAlignment};
use crate::types::ui::player_render::{create_url, url_to_buffer, PlayerOptions, PlayerType};
use crate::types::ui::prestige::get_prestige;

#[poise::command(slash_command, prefix_command)]
pub async fn run(
    ctx: Context<'_>,
    #[max_length = 16]
    username: String
) -> Result<(), Error> {

    let minecraft = PlayerDBService::instance();
    let player = minecraft.get_player_data(&username.clone()).await?;

    let hypixel = HypixelService::instance();
    let data = match hypixel.get_player_data(&player.id).await {
        Ok(data) => data,
        Err(e) => {
            ctx.say(format!("Failed to fetch Hypixel data: {}", e)).await?;
            error!("{}", e);
            return Ok(());
        }
    };

    let bedwars = &data.stats.bedwars;
    
    let image_data = {
        // Do async things before canvas creation
        let url = create_url(&player.id, PlayerOptions {
            player_type: PlayerType::Full,
            size: Some(192.0),
            ..Default::default()
        });
        let player_render = url_to_buffer(url.as_str()).await;
        
        let mut canvas = Canvas::new(500, 500);
        canvas.draw_image_from_path("assets/bedwars/apollo.png", 0.0, 0.0, 500.0, 500.0);

        let rank_color = data.primary_rank_color();
        
        let title_box = ContentBox::new(10.0, 10.0, 480.0, 40.0)
            .with_background(rank_color.with_a(100))
            .with_border(rank_color.with_a(180))
            .add_text(
                TextContent::new(
                    format!("{} {}<white>'s</white> <red>Bed</red><white>Wars Stats</white>", &data.rank_formatted(), &data.displayname),
                    0.0,
                    0.0,
                    24.0)
                    .with_shadow(true)
                    .with_alignment(Alignment::Center)
                    .with_vertical_alignment(VerticalAlignment::Middle)
            );
        
        let player_render_box = ContentBox::new(10.0, 60.0, 140.0, 240.0)
            .with_background(Color::from_argb(100, 255, 255, 255))
            .with_border(Color::from_argb(180, 255, 255, 255))
            .add_text(TextContent::new(get_prestige(data.achievements.bedwars_level), 0.0, 10.0, 20.0)
                .with_shadow(true)
                .with_alignment(Alignment::Center)
            )
            .add_image(ImageContent::new(player_render, 0.0, 10.0, 79.0, 128.0)
                .with_alignment(Alignment::Center)
                .with_vertical_alignment(VerticalAlignment::Middle)
            );
        
        let mode_stats_box = ContentBox::new(10.0, 310.0, 480.0, 180.0)
            .with_background(Color::from_argb(100, 255, 255, 255))
            .with_border(Color::from_argb(180, 255, 255, 255));
        
        canvas.render_content_boxes(vec![title_box, player_render_box, mode_stats_box]);
        
        canvas.data()
    };
    
    let attachment = CreateAttachment::bytes(image_data.as_bytes(), "image.png");
    
    ctx.send(CreateReply::default().attachment(attachment)).await?;

    Ok(())
}