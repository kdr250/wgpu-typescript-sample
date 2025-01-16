
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) fragColor: vec4<f32>,
}

@vertex
fn main(
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>,
) -> VertexOutput {

    var output: VertexOutput;
    output.position = position;
    output.fragColor = color;

    return output;
}
