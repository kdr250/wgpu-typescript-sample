import vertexShader from './shader/vertex.wgsl?raw'
import fragmentShader from './shader/fragment.wgsl?raw'

function frame(device: GPUDevice, context: GPUCanvasContext, pipeline: GPURenderPipeline) {
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: textureView,
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

    // create vertex buffer
    const quadVertexSize = 4 * 8;  // Byte size of a vertex
    const quadPositionOffset = 4 * 0;  // Byte offset of quad vertex position attribute
    const quadColorOffset = 4 * 4;
    const quadVertexCount = 6;

    const quadVertexArray = new Float32Array([
        // float4 position, float4 color
        -1,  1, 0, 1,   0, 1, 0, 1,
        -1, -1, 0, 1,   0, 0, 0, 1,
        1, -1, 0, 1,    1, 0, 0, 1,
        -1,  1, 0, 1,   0, 1, 0, 1,
        1, -1, 0, 1,    1, 0, 0, 1,
        1,  1, 0, 1,    1, 1, 0, 1,
    ]);

    // create a vertex buffer from the cube data
    const verticesBuffer = device.createBuffer({
        size: quadVertexArray.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation : true,
    });

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
    });

    frame(device, context, pipeline);
}

main();
