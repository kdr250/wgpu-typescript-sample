@group(0) @binding(0) var sourceTexture: texture_storage_2d<rgba8unorm, read>;
@group(0) @binding(1) var destinationTexture: texture_storage_2d<rgba8unorm, write>;

@compute
@workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dimensions = textureDimensions(sourceTexture);
    if (global_id.x >= dimensions.x || global_id.y >= dimensions.y) {
        return;
    }

    let color = textureLoad(sourceTexture, vec2<i32>(global_id.xy));

    let invertedColor = vec4f(1.0 - color.r, 1.0 - color.g, 1.0 - color.b, color.a);
    textureStore(destinationTexture, vec2<i32>(global_id.xy), invertedColor);
}
