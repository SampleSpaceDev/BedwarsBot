use crate::types::ui::canvas::Canvas;
use crate::types::ui::text_renderer::measure;
use crate::COLOR_REGEX;
use skia_safe::{Color, Data, Image, PaintStyle, Point};

pub struct ContentBox {
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    shapes: Vec<Shape>,
    texts: Vec<TextContent>,
    images: Vec<ImageContent>,
    padding: f32,
}

impl ContentBox {
    pub fn new(x: f32, y: f32, width: f32, height: f32) -> Self {
        Self {
            x,
            y,
            width,
            height,
            shapes: Vec::new(),
            texts: Vec::new(),
            images: Vec::new(),
            padding: 0.0,
        }
    }

    pub fn with_padding(mut self, padding: f32) -> Self {
        self.padding = padding;
        self
    }

    pub fn with_background(mut self, color: Color) -> Self {
        let background = Shape {
            color,
            ..Shape::rounded_rect(0.0, 0.0, self.width, self.height, 5.0, 5.0)
        };

        self.shapes.insert(0, background);
        self
    }

    pub fn with_border(mut self, color: Color) -> Self {
        let border = Shape {
            style: PaintStyle::Stroke,
            color,
            ..Shape::rounded_rect(0.0, 0.0, self.width, self.height, 5.0, 5.0)
        };

        self.shapes.insert(1, border);
        self
    }

    pub fn add_text(mut self, text: TextContent) -> Self {
        let text_with_padding = TextContent {
            x: text.x + self.padding,
            y: text.y + self.padding,
            ..text
        };

        self.texts.push(text_with_padding);
        self
    }

    pub fn add_shape(mut self, shape: Shape) -> Self {
        self.shapes.push(shape);
        self
    }
    
    pub fn add_image(mut self, image: ImageContent) -> Self {
        self.images.push(image);
        self
    }

    pub fn render(&self, canvas: &mut Canvas) {
        canvas.save();
        canvas.translate(self.x, self.y);

        for shape in &self.shapes {
            shape.render(canvas);
        }

        let inner_width = self.width - self.padding * 2.0;
        let inner_height = self.height - self.padding * 2.0;
        
        for image in &self.images {
            image.render(canvas, inner_width, inner_height);
        }

        for text in &self.texts {
            text.render(canvas, inner_width, inner_height);
        }

        canvas.restore();
    }
}

#[derive(Debug, Clone, Copy)]
pub enum Alignment {
    Left,
    Center,
    Right,
}

#[derive(Debug, Clone, Copy)]
pub enum VerticalAlignment {
    Top,
    Middle,
    Bottom,
}


/// Shape
pub enum ShapeType {
    Rectangle,
    Circle,
    Line,
    RoundedRectangle,
}

pub struct Shape {
    pub shape_type: ShapeType,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub color: Color,
    pub style: PaintStyle,
    pub rx: f32,
    pub ry: f32,
}

impl Shape {
    pub fn rect(x: f32, y: f32, width: f32, height: f32) -> Self {
        Self {
            shape_type: ShapeType::Rectangle,
            x,
            y,
            width,
            height,
            color: Color::BLACK,
            style: PaintStyle::Fill,
            rx: 0.0,
            ry: 0.0,
        }
    }

    pub fn circle(x: f32, y: f32, radius: f32) -> Self {
        Self {
            shape_type: ShapeType::Circle,
            x,
            y,
            width: radius,
            height: radius,
            color: Color::BLACK,
            style: PaintStyle::Fill,
            rx: 0.0,
            ry: 0.0,
        }
    }

    pub fn line(x: f32, y: f32, x2: f32, y2: f32) -> Self {
        Self {
            shape_type: ShapeType::Line,
            x,
            y,
            width: x2,
            height: y2,
            color: Color::BLACK,
            style: PaintStyle::Stroke,
            rx: 0.0,
            ry: 0.0,
        }
    }

    pub fn rounded_rect(x: f32, y: f32, width: f32, height: f32, rx: f32, ry: f32) -> Self {
        Self {
            shape_type: ShapeType::RoundedRectangle,
            x,
            y,
            width,
            height,
            color: Color::BLACK,
            style: PaintStyle::Fill,
            rx,
            ry,
        }
    }

    fn render(&self, canvas: &mut Canvas) {
        let original_color = canvas.paint.color();
        canvas.set_color(self.color);

        let original_style = canvas.paint.style();
        canvas.set_style(self.style);

        match self.shape_type {
            ShapeType::Rectangle => {
                canvas.draw_rect(self.x, self.y, self.width, self.height);
            }
            ShapeType::Circle => {
                canvas.draw_circle(self.x, self.y, self.width);
            }
            ShapeType::Line => {
                canvas.move_to(self.x, self.y);
                canvas.line_to(self.x + self.width, self.y + self.height);
                canvas.stroke();
            }
            ShapeType::RoundedRectangle => {
                canvas.draw_rounded_rect(self.x, self.y, self.width, self.height, self.rx, self.ry);
            }
        }

        canvas.set_color(original_color);
        canvas.set_style(original_style);
    }
}


/// Images
pub struct ImageContent {
    pub bytes: Vec<u8>,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub alignment: Alignment,
    pub vertical_alignment: VerticalAlignment
}

impl ImageContent {
    pub fn new(bytes: Vec<u8>, x: f32, y: f32, width: f32, height: f32) -> Self {
        Self {
            bytes,
            x,
            y,
            width,
            height,
            alignment: Alignment::Left,
            vertical_alignment: VerticalAlignment::Top,
        }
    }
    
    pub fn with_alignment(mut self, alignment: Alignment) -> Self {
        self.alignment = alignment;
        self
    }
    
    pub fn with_vertical_alignment(mut self, alignment: VerticalAlignment) -> Self {
        self.vertical_alignment = alignment;
        self
    }
    
    pub fn render(&self, canvas: &mut Canvas, inner_width: f32, inner_height: f32) {
        let image = Image::from_encoded(Data::new_copy(&self.bytes)).expect("Failed to decode image.");
        
        let adjusted_x = match self.alignment {
            Alignment::Left => self.x,
            Alignment::Center => (inner_width - image.width() as f32) / 2.0 + self.x,
            Alignment::Right => inner_width - (image.width() as f32) - self.x,
        };

        let adjusted_y = match self.vertical_alignment {
            VerticalAlignment::Top =>
                self.y - (image.height() as f32),
            VerticalAlignment::Middle =>
                self.y + (inner_height / 2.0) - (image.height() as f32 / 2.0),
            VerticalAlignment::Bottom =>
                self.y + inner_height - (image.height() as f32),
        };
        
        let position = Point::new(adjusted_x, adjusted_y);
        canvas.draw_image(image, position);
    }
}


/// TextContent
pub struct TextContent {
    pub text: String,
    pub x: f32,
    pub y: f32,
    pub size: f32,
    pub shadow: bool,
    pub alignment: Alignment,
    pub vertical_alignment: VerticalAlignment,
}

impl Default for Alignment {
    fn default() -> Self {
        Alignment::Left // Set Left as the default
    }
}

impl TextContent {
    pub fn new(text: String, x: f32, y: f32, size: f32) -> Self {
        Self {
            text,
            x,
            y,
            size,
            shadow: true,
            alignment: Alignment::Left,
            vertical_alignment: VerticalAlignment::Top,
        }
    }

    pub fn with_shadow(mut self, shadow: bool) -> Self {
        self.shadow = shadow;
        self
    }

    pub fn with_alignment(mut self, alignment: Alignment) -> Self {
        self.alignment = alignment;
        self
    }

    pub fn with_vertical_alignment(mut self, alignment: VerticalAlignment) -> Self {
        self.vertical_alignment = alignment;
        self
    }

    fn render(&self, canvas: &mut Canvas, inner_width: f32, inner_height: f32) {
        let modified_text = COLOR_REGEX.replace_all(&self.text, "");
        let metrics = measure(&modified_text, self.size);
        let text_height = metrics.descent - metrics.ascent;

        let adjusted_x = match self.alignment {
            Alignment::Left => self.x,
            Alignment::Center => (inner_width - metrics.width) / 2.0 + self.x,
            Alignment::Right => inner_width - metrics.width - self.x,
        };

        let adjusted_y = match self.vertical_alignment {
            VerticalAlignment::Top => 
                self.y - metrics.ascent,
            VerticalAlignment::Middle =>
                self.y + (inner_height / 2.0) - metrics.ascent - (text_height / 2.0),
            VerticalAlignment::Bottom => 
                self.y + inner_height - metrics.descent,
        };

        canvas.draw_text(self.text.as_str(), adjusted_x, adjusted_y, self.size, self.shadow);
    }
}