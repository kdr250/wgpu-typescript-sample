
struct Uniforms {
    projectionMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>,
    worldMatrix: mat4x4<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) fragUV: vec2<f32>,
}

@binding(0) @group(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>,
    @location(2) uv: vec2<f32>
) -> VertexOutput {

    var output: VertexOutput;
    output.position = uniforms.projectionMatrix * uniforms.viewMatrix * uniforms.worldMatrix * position;
    output.fragUV = uv;

    return output;
}
