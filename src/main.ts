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
}

main();
