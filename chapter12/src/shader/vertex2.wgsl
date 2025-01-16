
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>,
}



@vertex
fn main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
    var output: VertexOutput;
    
    let x = f32((vertex_index & 1) << 2);
    let y = f32((vertex_index & 2) << 1);

    output.texCoord.x = x * 0.5;
    output.texCoord.y = y * 0.5;

    output.position = vec4<f32>(x - 1.0, y - 1.0, 0, 1);

    return output;
}
