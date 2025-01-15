import computeShader from './shader/compute.wgsl?raw'

async function main() {

    // deviceの取得
    const g_adapter = await navigator.gpu.requestAdapter();
    if (!g_adapter) {
        throw new Error();
    }
    const device = await g_adapter.requestDevice();

    const size = 64;

    // Create input texture for storage
    const sourceTexture = device.createTexture({
        size: { width: size, height: size },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING,
    });

    // Create output texture for storage
    const destinationTexture = device.createTexture({
        size: { width: size, height: size },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.STORAGE_BINDING,
    });

    // テスト用に64x64ピクセルのランダム画像生成
    const imageCanvas = document.createElement('canvas');
    imageCanvas.width = size;
    imageCanvas.height = size;

    const imageContext = imageCanvas.getContext('2d');
    if (!imageContext) {
        throw new Error();
    }
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            imageContext.fillStyle = `rgb(${(x * 4) % 256}, ${(y * 4) % 256}, ${(x * 2 + y * 2) % 256})`;
            imageContext.fillRect(x, y, 1, 1);
        }
    }

    // inputCanvasに元画像を描画
    const inputCanvas = document.getElementById('inputCanvas') as HTMLCanvasElement;
    inputCanvas.width = size;
    inputCanvas.height = size;

    const inputContext = inputCanvas.getContext('2d');
    if (!inputContext) {
        throw new Error();
    }
    inputContext.drawImage(imageCanvas, 0, 0);

    // 入力画像データをCanvas2Dのコンテキストから取得
    const imageData = inputContext.getImageData(0, 0, size, size);
    const imageBytes = new Uint8Array(imageData.data.buffer);

    // まずは入力画像データ(Uint8Array)をGPUバッファにコピー（Uint8Arrayを直接GPUテクスチャにコピーできないため）
    const imageBuffer = device.createBuffer({
        size: imageBytes.byteLength,
        usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE,
    });
    await imageBuffer.mapAsync(GPUMapMode.WRITE);
    new Uint8Array(imageBuffer.getMappedRange()).set(imageBytes);
    imageBuffer.unmap();

    // GPUバッファからGPUテクスチャに画像データをコピー
    {
        const encoder = device.createCommandEncoder();
        encoder.copyBufferToTexture(
            { buffer: imageBuffer, bytesPerRow: size * 4 },
            { texture: sourceTexture },
            { width: size, height: size },
        );

        device.queue.submit([encoder.finish()]);
    }

    // シェーダーモジュールを作成
    const module = device.createShaderModule({ code: computeShader });

    // パイプラインを作成
    const pipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {
            module,
            entryPoint: 'main',
        },
    });

    // バインドグループを作成
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: sourceTexture.createView() },
            { binding: 1, resource: destinationTexture.createView() },
        ],
    });

    // コンピュートシェーダーを実行
    {
        const encoder = device.createCommandEncoder();
        const computePassEncoder = encoder.beginComputePass();
        computePassEncoder.setPipeline(pipeline);
        computePassEncoder.setBindGroup(0, bindGroup);
        const workgroupX = Math.ceil(size / 8);
        const workgroupY = Math.ceil(size / 8);
        computePassEncoder.dispatchWorkgroups(workgroupX, workgroupY);
        computePassEncoder.end();

        device.queue.submit([encoder.finish()]);
    }

    // 出力用Canvas
    const outputCanvas = document.getElementById('outputCanvas') as HTMLCanvasElement;
    outputCanvas.width = size;
    outputCanvas.height = size;
    const outputContext = outputCanvas.getContext('2d') as CanvasRenderingContext2D;

    // 出力バッファを作成
    const outputBuffer = device.createBuffer({
        size: imageBytes.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    {
        // 出力用Textureから出力バッファにコピー
        const encoder = device.createCommandEncoder();
        encoder.copyTextureToBuffer(
            { texture: destinationTexture },
            { buffer: outputBuffer, bytesPerRow: size * 4 },
            { width: size, height: size },
        );

        device.queue.submit([encoder.finish()]);
    }

    // 出力バッファをマップしてImageDataに変換
    await outputBuffer.mapAsync(GPUMapMode.READ);
    const outputArray = new Uint8Array(outputBuffer.getMappedRange());
    const outImageData = new ImageData(new Uint8ClampedArray(outputArray), size, size);
    outputContext.putImageData(outImageData, 0, 0);
}

main();
