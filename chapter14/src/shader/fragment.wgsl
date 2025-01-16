override is_red: bool;
override color_r: f32 = 1.0;
override color_g: f32 = 1.0;
override color_b: f32 = 1.0;

@fragment
fn main() -> @location(0) vec4<f32> {
    if (is_red) {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0);
    } else {
        return vec4<f32>(color_r, color_g, color_b, 1.0);
    }
}
