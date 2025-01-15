
@group(0) @binding(0) var texture: texture_2d<f32>;
@group(0) @binding(1) var textureSampler: sampler;

struct FragmentInput {
    @location(0) texCoord: vec2<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    return textureSample(texture, textureSampler, input.texCoord);
}
