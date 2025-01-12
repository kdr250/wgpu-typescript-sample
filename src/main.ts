import { initialize } from './initializer';
import { drawCallback } from './frame';

async function main() {

    const quadVertexSize = 4 * 8; // Byte size of one vertex.
    const quadPositionOffset = 4 * 0;
    const quadColorOffset = 4 * 4; // Byte offset of cube vertex color attribute.

    const quadVertexArray = new Float32Array([
        // float4 position, float4 color
        -1,  1, 0, 1,   0, 1, 0, 1,
        -1, -1, 0, 1,   0, 0, 0, 1,
        1, -1, 0, 1,   1, 0, 0, 1,
        1,  1, 0, 1,   1, 1, 0, 1,
    ]);

    const quadIndexArray = new Uint16Array([0, 1, 2, 0, 2, 3]);

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
        quadVertexSize,
        quadPositionOffset,
        quadColorOffset,
        quadVertexArray,
        quadIndexArray,
    });

    const { context, pipeline, verticesBuffer, indicesBuffer } = initResult;

    const drawInput = {device, context, pipeline, verticesBuffer, indicesBuffer, quadIndexArray};
    const callback = drawCallback(drawInput);

    requestAnimationFrame(callback);
}

main();
