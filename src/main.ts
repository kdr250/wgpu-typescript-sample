import { initialize } from './initializer';
import { drawCallback } from './frame';

async function main() {

    const vertexSize = 4 * 10; // Byte size of one vertex.
    const positionOffset = 4 * 0;
    const colorOffset = 4 * 4; // Byte offset of cube vertex color attribute.
    const uvOffset = 4 * 8;
    const vertexCount = 36;

    const vertexArray = new Float32Array([
        // float4 position, float4 color float2 uv
        1, -1, 1, 1, 1, 0, 1, 1, 1, 1,
        -1, -1, 1, 1, 0, 0, 1, 1, 0, 1,
        -1, -1, -1, 1, 0, 0, 0, 1, 0, 0,
        1, -1, -1, 1, 1, 0, 0, 1, 1, 0,
        1, -1, 1, 1, 1, 0, 1, 1, 1, 1,
        -1, -1, -1, 1, 0, 0, 0, 1, 0, 0,

        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, -1, 1, 1, 1, 0, 1, 1, 0, 1,
        1, -1, -1, 1, 1, 0, 0, 1, 0, 0,
        1, 1, -1, 1, 1, 1, 0, 1, 1, 0,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, -1, -1, 1, 1, 0, 0, 1, 0, 0,

        -1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
        1, 1, -1, 1, 1, 1, 0, 1, 0, 0,
        -1, 1, -1, 1, 0, 1, 0, 1, 1, 0,
        -1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
        1, 1, -1, 1, 1, 1, 0, 1, 0, 0,

        -1, -1, 1, 1, 0, 0, 1, 1, 1, 1,
        -1, 1, 1, 1, 0, 1, 1, 1, 0, 1,
        -1, 1, -1, 1, 0, 1, 0, 1, 0, 0,
        -1, -1, -1, 1, 0, 0, 0, 1, 1, 0,
        -1, -1, 1, 1, 0, 0, 1, 1, 1, 1,
        -1, 1, -1, 1, 0, 1, 0, 1, 0, 0,

        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        -1, 1, 1, 1, 0, 1, 1, 1, 0, 1,
        -1, -1, 1, 1, 0, 0, 1, 1, 0, 0,
        -1, -1, 1, 1, 0, 0, 1, 1, 0, 0,
        1, -1, 1, 1, 1, 0, 1, 1, 1, 0,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1,

        1, -1, -1, 1, 1, 0, 0, 1, 1, 1,
        -1, -1, -1, 1, 0, 0, 0, 1, 0, 1,
        -1, 1, -1, 1, 0, 1, 0, 1, 0, 0,
        1, 1, -1, 1, 1, 1, 0, 1, 1, 0,
        1, -1, -1, 1, 1, 0, 0, 1, 1, 1,
        -1, 1, -1, 1, 0, 1, 0, 1, 0, 0,
    ]);

    const canvas = document.querySelector('canvas');
    if (!canvas) {
        throw new Error();
    }

    // deviceの取得
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error();
    }
    const device = await adapter.requestDevice();

    const initResult = await initialize({
        canvas,
        device,
        vertexSize,
        positionOffset,
        colorOffset,
        uvOffset,
        vertexArray
    });

    const drawInput = { device, vertexCount, ...initResult };
    const callback = drawCallback(drawInput);

    requestAnimationFrame(callback);
}

main();
