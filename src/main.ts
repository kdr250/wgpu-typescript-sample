import computeShader from './shader/compute.wgsl?raw';

async function main() {
    // deviceの取得
    const g_adapter = await navigator.gpu.requestAdapter();
    if (!g_adapter) {
        throw new Error();
    }
    const device = await g_adapter.requestDevice();

    // 入力配列を作成
    const inputArray = new Float32Array([1, 2, 3, 4]);

    // 入力用のバッファーを作成
    const inputBuffer = device.createBuffer({
        size: inputArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // inputBufferにデータを書き込む
    device.queue.writeBuffer(inputBuffer, 0, inputArray);

    // 出力用のバッファーを作成
    const outputBuffer = device.createBuffer({
        size: inputArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const computeShaderModule = device.createShaderModule({ code: computeShader });

    const computePipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {
            module: computeShaderModule,
            entryPoint: 'main',
        },
    });

    const bindGroup = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: inputBuffer } },
            { binding: 1, resource: { buffer: outputBuffer } },
        ],
    });

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);

    const workGroupSize = 4;

    passEncoder.dispatchWorkgroups(inputArray.length / workGroupSize);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);

    // Get a GPU buffer for reading
    const stagingBuffer = device.createBuffer({
        mappedAtCreation: false,
        size: 16,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    // Encode commands for copying buffer to buffer.
    const copyEncoder = device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(
        outputBuffer,  // source buffer
        0,             // source offset
        stagingBuffer, // destination buffer
        0,             // destination offset
        16             // size
    );
    const copyCommand = copyEncoder.finish();
    device.queue.submit([copyCommand]);

    // 結果を取得
    await stagingBuffer.mapAsync(GPUMapMode.READ);
    const copyArrayBuffer = stagingBuffer.getMappedRange();
    console.log(new Float32Array(copyArrayBuffer)); // [2, 4, 6, 8]
    stagingBuffer.unmap();
}

main();
