import vertexShader from './shader/vertex.wgsl?raw'
import fragmentShader from './shader/fragment.wgsl?raw'

function frame(device: GPUDevice, pipeline: GPURenderPipeline, texture: GPUTexture) {
    const commandEncoder = device.createCommandEncoder();

    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: texture.createView(),
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

function drawImageFromBuffer(arrayBuffer: ArrayBuffer, width: number, height: number) {
    // キャンバスを作成
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error();
    }

    // ImageDataオブジェクトを作成
    const imageData = new ImageData(
        new Uint8ClampedArray(arrayBuffer),
        width,
        height,
    );

    // キャンバスにImageDataを描画
    context.putImageData(imageData, 0, 0);

    return canvas;
}

async function getTextureDataAndShowAsCanvas(device: GPUDevice, texture: GPUTexture) {
    // GPUBufferを作成（テクスチャのデータを読み出すため）
    const bufferSize = 256 * 256 * 4;
    const buffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const commandEncoder = device.createCommandEncoder();

    commandEncoder.copyTextureToBuffer(
        { texture: texture },
        { buffer: buffer, bytesPerRow: 256 * 4 },
        { width: 256, height: 256, depthOrArrayLayers: 1 },
    );

    // コマンドをキューに送信して実行
    device.queue.submit([commandEncoder.finish()]);

    // データを読み出す
    await buffer.mapAsync(GPUMapMode.READ);
    const arrayBuffer = buffer.getMappedRange();

    // 画像を表示
    const canvas = drawImageFromBuffer(arrayBuffer, 256, 256);

    document.body.appendChild(canvas);

    buffer.unmap();
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

    // Create texture
    const texture = device.createTexture({
        size: [256, 256],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    });

    frame(device, pipeline, texture);

    await getTextureDataAndShowAsCanvas(device, texture);
}

main();
