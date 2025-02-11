use std::default::Default;
use std::time::Instant;
use crate::types::ui::canvas::{Canvas};
use crate::services::hypixel::HypixelService;
use crate::services::minecraft::PlayerDBService;
use crate::{Context, Error};
use poise::CreateReply;
use serenity::all::CreateAttachment;
use skia_safe::{Color, Image};
use tracing::error;
use images::IRON_INGOT;
use crate::services::render::PlayerRenderService;
use crate::types::hypixel::bedwars::Ratioable;
use crate::types::ui::content_box::{ContentBox, ImageContent, Alignment, TextContent, VerticalAlignment};
use crate::types::ui::images;
use crate::types::ui::images::{DIAMOND, EMERALD, GOLD_INGOT};
use crate::types::ui::prestige::{format_level, get_level, get_prestige_progress};
use crate::types::utils::num;

#[poise::command(slash_command, prefix_command)]
pub async fn run(
    ctx: Context<'_>,
    #[max_length = 16]
    username: String
) -> Result<(), Error> {
    let start = Instant::now();

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
        let render = PlayerRenderService::instance();
        let player_render = render.get_player_data(&player.id).await.unwrap_or_else(|_| Vec::new());
        
        let mut canvas = Canvas::new(500, 500);
        canvas.draw_image_from_path("assets/bedwars/apollo.png", 0.0, 0.0, 500.0, 500.0);
        
        let title_box = {
            let rank_color = data.primary_rank_color();
            
            ContentBox::new(10.0, 10.0, 480.0, 40.0)
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
                )
        };

        let default_background_color = Color::from_argb(100, 0, 0, 0);
        let default_border_color = Color::from_argb(180, 0, 0, 0);

        let player_render_box = {
            ContentBox::new(10.0, 60.0, 140.0, 245.0)
                .with_background(default_background_color)
                .with_border(default_border_color)
                .add_text(TextContent::new(format_level(data.achievements.bedwars_level), 0.0, 10.0, 20.0)
                    .with_shadow(true)
                    .with_alignment(Alignment::Center)
                )
                .add_image(ImageContent::new(player_render, 0.0, 10.0, 79.0, 128.0)
                    .with_alignment(Alignment::Center)
                    .with_vertical_alignment(VerticalAlignment::Middle)
                )
        };
        
        let prestige_box = {
            ContentBox::new(160.0, 60.0, 330.0, 30.0)
                .with_background(default_background_color)
                .with_border(default_border_color)
                .add_text(
                    TextContent::new(get_prestige_progress(bedwars.experience as u32), 0.0, 0.0, 20.0)
                        .with_alignment(Alignment::Center)
                        .with_vertical_alignment(VerticalAlignment::Middle)
                )
        };
        
        let projected_stats_box = {
            let mut _box = ContentBox::new(160.0, 100.0, 330.0, 115.0)
                .with_background(default_background_color)
                .with_border(default_border_color)
                .with_padding(10.0);
            
            let level = get_level(bedwars.experience as u32);
            let next_prestige = (level.floor() / 100.0).ceil() * 100.0;
            let next_prestige_formatted = format_level(next_prestige as u32);
            let stars_to_go = (next_prestige - level) as u32;
            
            let projected_kills = bedwars.overall.kills + (((bedwars.overall.kills as f32 / level).round() as u32) * stars_to_go);
            let projected_final_kills = bedwars.overall.final_kills + (((bedwars.overall.final_kills as f32 / level).round() as u32) * stars_to_go);
            let projected_fkdr: f32 = projected_final_kills as f32 / bedwars.overall.final_deaths as f32;
            let projected_beds = bedwars.overall.beds_broken + (((bedwars.overall.beds_broken as f32 / level).round() as u32) * stars_to_go);
            let projected_wins = bedwars.overall.wins + (((bedwars.overall.wins as f32 / level).round() as u32) * stars_to_go);
            
            _box
                .add_text(TextContent::new(
                    format!("<white>Kills at {}: <yellow>{}</yellow> (<green>+{}</green>)",
                            next_prestige_formatted,
                            num(projected_kills),
                            num(projected_kills - bedwars.overall.kills)),
                    0.0, 0.0, 16.0)
                    .with_alignment(Alignment::Left)
                )
                .add_text(TextContent::new(
                    format!("<white>Finals at {}: <yellow>{}</yellow> (<green>+{}</green>)",
                            next_prestige_formatted,
                            num(projected_final_kills),
                            num(projected_final_kills - bedwars.overall.final_kills)),
                    0.0, 18.0, 16.0)
                    .with_alignment(Alignment::Left)
                )
                .add_text(TextContent::new(
                    format!("<white>Beds at {}: <yellow>{}</yellow> (<green>+{}</green>)",
                            next_prestige_formatted,
                            num(projected_beds),
                            num(projected_beds - bedwars.overall.beds_broken)),
                    0.0, 36.0, 16.0)
                    .with_alignment(Alignment::Left)
                )
                .add_text(TextContent::new(
                    format!("<white>Wins at {}: <yellow>{}</yellow> (<green>+{}</green>)",
                            next_prestige_formatted,
                            num(projected_wins),
                            num(projected_wins - bedwars.overall.wins)),
                    0.0, 54.0, 16.0)
                    .with_alignment(Alignment::Left)
                )
                .add_text(TextContent::new(
                    format!("<white>FKDR at {}: <yellow>{}</yellow> (<green>+{}</green>)",
                            next_prestige_formatted,
                            num(projected_fkdr),
                            num(projected_fkdr - bedwars.overall.fkdr())),
                    0.0, 72.0, 16.0)
                    .with_alignment(Alignment::Left)
                )
                .add_text(TextContent::new(
                    "<gray>Note: this assumes no negative stats are taken.</gray>".to_string(),
                        0.0, 5.0, 10.0)
                    .with_alignment(Alignment::Center)
                    .with_vertical_alignment(VerticalAlignment::Bottom)
                    .with_shadow(false)
                )
            
        };

        let resources_box = {
            ContentBox::new(160.0, 225.0, 130.0, 80.0)
                .with_background(default_background_color)
                .with_border(default_border_color)
                .with_padding(10.0)
                // Iron
                .add_image(ImageContent::new(IRON_INGOT.clone(), 8.0, 21.0, 16.0, 16.0))
                .add_text(TextContent::new(format!("<gray>{}</gray>", num(bedwars.overall.iron_collected)), 18.0, -3.0, 16.0))
                // Gold
                .add_image(ImageContent::new(GOLD_INGOT.clone(), 8.0, 39.0, 16.0, 16.0))
                .add_text(TextContent::new(format!("<yellow>{}</yellow>", num(bedwars.overall.gold_collected)), 18.0, 15.0, 16.0))
                // Diamond
                .add_image(ImageContent::new(DIAMOND.clone(), 8.0, 57.0, 16.0, 16.0))
                .add_text(TextContent::new(format!("<aqua>{}</aqua>", num(bedwars.overall.diamond_collected)), 18.0, 33.0, 16.0))
                // Emerald
                .add_image(ImageContent::new(EMERALD.clone(), 8.0, 75.0, 16.0, 16.0))
                .add_text(TextContent::new(format!("<dark_green>{}</dark_green>", num(bedwars.overall.emerald_collected)), 18.0, 51.0, 16.0))
        };

        let misc_box = {
            let _box = ContentBox::new(300.0, 225.0, 190.0, 80.0)
                .with_background(default_background_color)
                .with_border(default_border_color);

            _box
        };

        let stats_box_background = ContentBox::new(10.0, 315.0, 480.0, 175.0)
            .with_background(default_background_color)
            .with_border(default_border_color);
        
        let overall_stats_box = {
            ContentBox::new(10.0, 315.0, 88.0, 175.0)
        };
        
        let solo_stats_box = {
            ContentBox::new(108.0, 315.0, 88.0, 175.0)
        };
        
        let doubles_stats_box = {
            ContentBox::new(206.0, 315.0, 88.0, 175.0)
        };
        
        let threes_stats_box = {
            ContentBox::new(304.0, 315.0, 88.0, 175.0)
        };
        
        let fours_stats_box = {
            ContentBox::new(402.0, 315.0, 88.0, 175.0)
        };
        
        canvas.render_content_boxes(vec![
            title_box,
            player_render_box,
            prestige_box,
            projected_stats_box,
            resources_box,
            misc_box,
            stats_box_background,
            overall_stats_box,
            solo_stats_box,
            doubles_stats_box,
            threes_stats_box,
            fours_stats_box
        ]);
        
        canvas.data()
    };
    
    let attachment = CreateAttachment::bytes(image_data.as_bytes(), "image.png");
    
    ctx.send(CreateReply::default().attachment(attachment).content(format!("{:?}", start.elapsed()))).await?;
    
    Ok(())
}