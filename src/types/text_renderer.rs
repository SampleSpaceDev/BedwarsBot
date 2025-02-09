use skia_safe::{Canvas, Color, Color4f, Font, Paint};
use crate::canvas::MINECRAFT_TYPEFACE;
use crate::types::colors::colors;
use crate::types::colors::colors::{exists, COLORS};
use crate::types::colors::shadows::SHADOWS;

#[derive(Debug)]
enum Node {
    Text(String),
    Tag { tag: String, children: Vec<Node> },
}

fn parse_nodes_rec<'a>(mut input: &'a str, expected: Option<&str>) -> (Vec<Node>, &'a str) {
    let mut nodes = Vec::new();

    while !input.is_empty() {
        if input.starts_with("</") {
            if let Some(end) = input.find('>') {
                let closing_tag = &input[..end + 1];
                if let Some(exp) = expected {
                    if closing_tag == exp {
                        input = &input[end + 1..];
                        return (nodes, input);
                    } else {
                        nodes.push(Node::Text(closing_tag.to_string()));
                        input = &input[end + 1..];
                        continue;
                    }
                } else {
                    nodes.push(Node::Text(closing_tag.to_string()));
                    input = &input[end + 1..];
                    continue;
                }
            } else {
                nodes.push(Node::Text(input.to_string()));
                input = "";
                break;
            }
        } else if input.starts_with("<") {
            if let Some(end) = input.find('>') {
                let tag = &input[1..end];
                input = &input[end + 1..];

                let expected_closing = format!("</{}>", tag);

                let (children, new_input) = parse_nodes_rec(input, Some(&expected_closing));
                input = new_input;

                nodes.push(Node::Tag { tag: tag.to_string(), children });
            } else {
                nodes.push(Node::Text(input.to_string()));
                input = "";
                break;
            }
        } else {
            if let Some(idx) = input.find('<') {
                let text = &input[..idx];
                nodes.push(Node::Text(text.to_string()));
                input = &input[idx..];
            } else {
                nodes.push(Node::Text(input.to_string()));
                input = "";
            }
        }
    }

    (nodes, input)
}

fn parse_nodes(input: &str) -> Vec<Node> {
    let (nodes, _) = parse_nodes_rec(input, None);
    nodes
}

fn flatten_nodes(nodes: &[Node], current_color: Option<Color>) -> Vec<(String, Option<Color>)> {
    let mut segments = Vec::new();

    for node in nodes {
        match node {
            Node::Text(text) => {
                segments.push((text.clone(), current_color));
            }
            Node::Tag { tag, children } => {
                let new_color = parse_color(tag).or(current_color);
                let child_segments = flatten_nodes(children, new_color);
                segments.extend(child_segments);
            }
        }
    }

    segments
}

fn parse_and_flatten(input: &str) -> Vec<(String, Option<Color>)> {
    let nodes = parse_nodes(input);
    flatten_nodes(&nodes, None)
}

fn parse_color(tag: &str) -> Option<Color> {
    if tag.starts_with('#') {
        let hex = &tag[1..];
        if hex.len() == 6 {
            if let Ok(rgb) = u32::from_str_radix(hex, 16) {
                let r = ((rgb >> 16) & 0xFF) as u8;
                let g = ((rgb >> 8) & 0xFF) as u8;
                let b = (rgb & 0xFF) as u8;

                return Some(Color::from_argb(255, r, g, b))
            }
        } else if hex.len() == 8 {
            if let Ok(argb) = u32::from_str_radix(hex, 16) {
                let a = ((argb >> 24) & 0xFF) as u8;
                let r = ((argb >> 16) & 0xFF) as u8;
                let g = ((argb >> 8) & 0xFF) as u8;
                let b = (argb & 0xFF) as u8;
                
                return Some(Color::from_argb(a, r, g, b))
            }
        }
        None
    } else {        
        colors::get_color(tag.to_lowercase().as_str()).map(|hex| {
            let rgb = u32::from_str_radix(&hex[1..], 16).unwrap();
            let r = ((rgb >> 16) & 0xFF) as u8;
            let g = ((rgb >> 8) & 0xFF) as u8;
            let b = (rgb & 0xFF) as u8;
            
            Color::from_argb(255, r, g, b)
        })
    }
}

pub struct TextRenderer<'a> {
    canvas: &'a Canvas,
}

impl<'a> TextRenderer<'a> {
    pub fn new(canvas: &'a Canvas) -> Self {
        Self { canvas }
    }
    
    pub fn draw_text(&mut self, input: &str, mut x: f32, y: f32, text_size: f32, shadow: bool) {
        let segments = parse_and_flatten(input);
        
        let mut paint = Paint::new(Color4f::new(0.0, 0.0, 0.0, 255.0), None);
        paint.set_anti_alias(true);
        let font = Font::new((*MINECRAFT_TYPEFACE).clone(), text_size);
        
        for (text, color_opt) in segments {
            if text.is_empty(){
                continue;
            }
            
            if let Some(color) = color_opt {
                paint.set_color(color);
            } else {
                paint.set_color(Color::BLACK);
            }
            
            if shadow {
                let offset = if text_size >= 16.0 { 3.0 } else { 2.0 };
                let new_color = get_shadow(paint.color());
                self.canvas.draw_str(&text, (x + offset, y + offset), &font, paint.clone().set_color(new_color));
            }

            self.canvas.draw_str(&text, (x, y), &font, &paint);
            
            let (width, _) = font.measure_str(&text, Some(&paint));
            x += width as f32;
        }
    }
}

fn color_to_hex(color: Color) -> String {
    let r = color.r();
    let g = color.g();
    let b = color.b();
    
    format!("#{:02X}{:02X}{:02X}", r, g, b)
}

fn hex_to_color(hex: &str) -> Color {
    let rgb = u32::from_str_radix(&hex[1..], 16).unwrap();
    let r = ((rgb >> 16) & 0xFF) as u8;
    let g = ((rgb >> 8) & 0xFF) as u8;
    let b = (rgb & 0xFF) as u8;
    
    Color::from_argb(255, r, g, b)
}

pub fn get_shadow(color: Color) -> Color {
    let hex = color_to_hex(color);
    
    if exists(&hex) {
        let index = COLORS.iter().position(|(_, v)| *v == hex).unwrap();
        let (_, shadow_hex) = SHADOWS[index];
        
        hex_to_color(shadow_hex)
    } else {
        let factor = 0.75;
        let new_color = darken_color(color, factor);
        
        new_color
    }
}

fn darken_color(color: Color, factor: f32) -> Color {
    let r = color.r();
    let g = color.g();
    let b = color.b();
    
    let adjust = |component: u8| -> u8 {
        let comp = component as f32;
        
        let new_comp = if factor >= 0.0 {
            comp * (1.0 - factor)       
        } else {
            comp + (255.0 - comp) * (-factor)
        };
        
        new_comp.round().clamp(0.0, 255.0) as u8
    };
    
    Color::from_rgb(adjust(r), adjust(g), adjust(b))
}