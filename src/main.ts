import vertexShader from './shader/vertex.wgsl?raw'
import fragmentShader from './shader/fragment.wgsl?raw'
import vertexShader2 from './shader/vertex2.wgsl?raw'
import fragmentShader2 from './shader/fragment2.wgsl?raw'

function frame(device: GPUDevice, pipeline: GPURenderPipeline, renderTargetTextureView: GPUTextureView) {
    // TODO
}

async function main() {

    // deviceの取得
    const g_adapter = await navigator.gpu.requestAdapter();
    if (!g_adapter) {
        throw new Error();
    }

    const device = await g_adapter.requestDevice();

    // 三角形を描画するときのRenderPipeline
    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({
                code: vertexShader,
            }),
            entryPoint: 'main',
        },
        fragment: {
            module: device.createShaderModule({
                code: fragmentShader,
            }),
            entryPoint: 'main',
            targets: [
                {
                    format: 'rgba8unorm',
                }
            ]
        },
        primitive: {
            topology: 'triangle-list'
        },
    });

    // Create render texture
    const renderTargetTexture = device.createTexture({
        size: [512, 512, 1],
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        format: 'rgba8unorm',
    });
    const renderTargetTextureView = renderTargetTexture.createView();

    // Create sampler
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    frame(device, pipeline, renderTargetTextureView);
}

main();
