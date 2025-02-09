use crate::types::text_renderer::TextRenderer;
use once_cell::sync::Lazy;
use skia_safe::{surfaces, Color, Data, EncodedImageFormat, FontMgr, FontStyle, Image, Paint, PaintStyle, Path, Point, Surface, Typeface};
use std::{fs, mem};

pub struct Canvas {
    surface: Surface,
    path: Path,
    paint: Paint,
}

pub static MINECRAFT_TYPEFACE: Lazy<Typeface> = Lazy::new(|| {
    FontMgr::default()
        .match_family_style("Minecraft", FontStyle::normal())
        .expect("Failed to load the Minecraft typeface.")
});

impl Canvas {
    pub fn new(width: i32, height: i32) -> Canvas {
        let mut surface = surfaces::raster_n32_premul((width, height)).expect("surface");
        let path = Path::new();
        let mut paint = Paint::default();
        paint.set_color(Color::BLACK);
        paint.set_anti_alias(true);
        paint.set_stroke_width(1.0);
        surface.canvas().clear(Color::WHITE);
        
        Canvas {
            surface,
            path,
            paint,
        }
    }

    #[inline]
    pub fn set_color(&mut self, color: Color) {
        self.paint.set_color(color);
    }

    #[inline]
    pub fn save(&mut self) {
        self.canvas().save();
    }

    #[inline]
    pub fn translate(&mut self, dx: f32, dy: f32) {
        self.canvas().translate((dx, dy));
    }

    #[inline]
    pub fn scale(&mut self, sx: f32, sy: f32) {
        self.canvas().scale((sx, sy));
    }

    #[inline]
    pub fn move_to(&mut self, x: f32, y: f32) {
        self.begin_path();
        self.path.move_to((x, y));
    }

    #[inline]
    pub fn line_to(&mut self, x: f32, y: f32) {
        self.path.line_to((x, y));
    }

    #[inline]
    pub fn quad_to(&mut self, cpx: f32, cpy: f32, x: f32, y: f32) {
        self.path.quad_to((cpx, cpy), (x, y));
    }

    #[allow(dead_code)]
    #[inline]
    pub fn bezier_curve_to(&mut self, cp1x: f32, cp1y: f32, cp2x: f32, cp2y: f32, x: f32, y: f32) {
        self.path.cubic_to((cp1x, cp1y), (cp2x, cp2y), (x, y));
    }

    #[allow(dead_code)]
    #[inline]
    pub fn close_path(&mut self) {
        self.path.close();
    }

    #[inline]
    pub fn begin_path(&mut self) {
        let new_path = Path::new();
        self.surface.canvas().draw_path(&self.path, &self.paint);
        let _ = mem::replace(&mut self.path, new_path);
    }
    
    #[inline]
    pub fn draw_rect(&mut self, x: f32, y: f32, width: f32, height: f32) {
        let rect = skia_safe::Rect::new(x, y, x + width, y + height);
        self.surface.canvas().draw_rect(rect, &self.paint);
    }

    #[inline]
    pub fn draw_circle(&mut self, cx: f32, cy: f32, radius: f32) {
        self.surface.canvas().draw_circle((cx, cy), radius, &self.paint);
    }

    #[inline]
    pub fn draw_oval(&mut self, x: f32, y: f32, width: f32, height: f32) {
        let oval = skia_safe::Rect::new(x, y, x + width, y + height);
        self.surface.canvas().draw_oval(oval, &self.paint);
    }
    
    #[inline]
    pub fn draw_text(&mut self, text: &str, x: f32, y: f32, size: f32, shadow: bool) {
        let canvas = self.surface.canvas();
        let mut renderer = TextRenderer::new(canvas);
        
        renderer.draw_text(text, x, y, size, shadow);
    }
    
    #[inline]
    pub fn draw_image(&mut self, path: &str, x: f32, y: f32, width: f32, height: f32) {
        let img_bytes = fs::read(&path).expect("Failed to load image.");
        let image = Image::from_encoded(Data::new_copy(&img_bytes)).expect("Failed to decode image.");
        
        let position = Point::new(x, y);
        self.canvas().draw_image(&image, position, None);
    }

    #[inline]
    pub fn stroke(&mut self) {
        self.paint.set_style(PaintStyle::Stroke);
        self.surface.canvas().draw_path(&self.path, &self.paint);
    }

    #[inline]
    pub fn fill(&mut self) {
        self.paint.set_style(PaintStyle::Fill);
        self.surface.canvas().draw_path(&self.path, &self.paint);
    }

    #[inline]
    pub fn set_line_width(&mut self, width: f32) {
        self.paint.set_stroke_width(width);
    }

    #[inline]
    pub fn data(&mut self) -> Data {
        let image = self.surface.image_snapshot();
        let mut context = self.surface.direct_context();
        image
            .encode(context.as_mut(), EncodedImageFormat::PNG, None)
            .unwrap()
    }

    #[inline]
    fn canvas(&mut self) -> &skia_safe::Canvas {
        self.surface.canvas()
    }
}