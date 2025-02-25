
struct Uniforms {
    projectionMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>,
    worldMatrix: mat4x4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) fragColor: vec4<f32>,
}

@binding(0) @group(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>,
    @location(2) pos: vec2<f32>,
) -> VertexOutput {

    var output: VertexOutput;
    output.position = uniforms.projectionMatrix * uniforms.viewMatrix * uniforms.worldMatrix * (position + vec4<f32>(pos.x, pos.y, 0, 1));
    output.fragColor = color;

    return output;
}
