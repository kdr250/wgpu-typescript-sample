import vertexShader from './shader/vertex.wgsl?raw'
import fragmentShader from './shader/fragment.wgsl?raw'

function frame(device: GPUDevice, context: GPUCanvasContext, pipeline: GPURenderPipeline, msaaTexture: GPUTexture) {
    const commandEncoder = device.createCommandEncoder();
    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: msaaTexture.createView(),
                resolveTarget: context.getCurrentTexture().createView(),
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'discard',
            },
        ],
    };
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
}

async function main() {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error();
    }

    // WebGPUコンテキストの取得
    const context = canvas.getContext('webgpu') as GPUCanvasContext | null;
    if (!context) {
        throw new Error();
    }

    // deviceの取得
    const g_adapter = await navigator.gpu.requestAdapter();
    if (!g_adapter) {
        throw new Error();
    }

    const device = await g_adapter.requestDevice();

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device: device,
        format: presentationFormat,
        alphaMode: 'opaque',
    });

    const sampleCount = 4;

    // create a render pipeline
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
                    format: presentationFormat, // @location(0) in fragment shader
                }
            ]
        },
        primitive: {
            topology: 'triangle-list'
        },
        multisample: {
            count: sampleCount,
        }
    });

    // Create MSAA texture
    const msaaTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        sampleCount,
        format: presentationFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    frame(device, context, pipeline, msaaTexture);
}

main();
