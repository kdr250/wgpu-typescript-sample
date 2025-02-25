import vertexShader from './shader/vertex.wgsl?raw'
import fragmentShader from './shader/fragment.wgsl?raw'
import vertexShader2 from './shader/vertex2.wgsl?raw'
import fragmentShader2 from './shader/fragment2.wgsl?raw'

function frame(device: GPUDevice, context: GPUCanvasContext, pipeline: GPURenderPipeline, pipeline2: GPURenderPipeline, bindGroup: GPUBindGroup, renderTargetTextureView: GPUTextureView) {
    // First pass
    const commandEncoder = device.createCommandEncoder();
    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: renderTargetTextureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    };
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.end();

    // Second pass
    const renderPassDescriptor2: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: context.getCurrentTexture().createView(),
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
    };
    const passEncoder2 = commandEncoder.beginRenderPass(renderPassDescriptor2);
    passEncoder2.setPipeline(pipeline2);
    passEncoder2.setBindGroup(0, bindGroup);
    passEncoder2.draw(3, 1, 0, 0);
    passEncoder2.end();

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

    // テクスチャを描画するときのRenderPipeline
    const pipeline2 = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({ code: vertexShader2 }),
            entryPoint: 'main',
        },
        fragment: {
            module: device.createShaderModule({ code: fragmentShader2 }),
            entryPoint: 'main',
            targets: [
                {
                    format: presentationFormat,
                }
            ]
        },
        primitive: {
            topology: 'triangle-list',
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

    // Ccreate bind group
    const bindGroup = device.createBindGroup({
        layout: pipeline2.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: renderTargetTextureView,
            },
            {
                binding: 1,
                resource: sampler,
            },
        ],
    });

    frame(device, context, pipeline, pipeline2, bindGroup, renderTargetTextureView);
}

main();
