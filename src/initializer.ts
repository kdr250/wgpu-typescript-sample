import vertexShader from './shader/vertex.wgsl?raw'
import fragmentShader from './shader/fragment.wgsl?raw'

type InitializationInput = {
    canvas: HTMLCanvasElement,
    device: GPUDevice,
    quadVertexSize: number,
    quadPositionOffset: number,
    quadColorOffset: number,
    quadVertexArray: Float32Array<ArrayBuffer>,
    quadIndexArray: Uint16Array<ArrayBuffer>,
}

type InitializationOutput = {
    context: GPUCanvasContext,
    pipeline: GPURenderPipeline,
    verticesBuffer: GPUBuffer,
    indicesBuffer: GPUBuffer,
};

async function initialize(input: InitializationInput): Promise<InitializationOutput> {

    const { canvas, device, quadVertexSize, quadPositionOffset, quadColorOffset, quadVertexArray, quadIndexArray } = input;

    const context = canvas.getContext('webgpu') as GPUCanvasContext;

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: presentationFormat,
        alphaMode: 'opaque',
    });

    // create a render pipeline
    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({code: vertexShader}),
            entryPoint: 'main',
            buffers: [
            {
                // 配列の要素間の距離をバイト単位で指定します。
                arrayStride: quadVertexSize,

                // 頂点バッファの属性を指定します。
                attributes: [
                {
                    // position
                    shaderLocation: 0, // @location(0) in vertex shader
                    offset: quadPositionOffset,
                    format: 'float32x4',
                },
                {
                    // color
                    shaderLocation: 1, // @location(1) in vertex shader
                    offset: quadColorOffset,
                    format: 'float32x4',
                },
                ],
            },
            ],
        },
        fragment: {
            module: device.createShaderModule({code: fragmentShader}),
            entryPoint: 'main',
            targets: [
            // 0
            { // @location(0) in fragment shader
                format: presentationFormat,
            },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });

    // Create a vertex buffer from the quad data.
    const verticesBuffer = device.createBuffer({
        size: quadVertexArray.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });

    new Float32Array(verticesBuffer.getMappedRange()).set(quadVertexArray);
    verticesBuffer.unmap();

    const indicesBuffer = device.createBuffer({
        size: quadIndexArray.byteLength,
        usage: GPUBufferUsage.INDEX,
        mappedAtCreation: true,
    });

    new Uint16Array(indicesBuffer.getMappedRange()).set(quadIndexArray);
    indicesBuffer.unmap();

    return { context, pipeline, verticesBuffer, indicesBuffer };
}

export { initialize };
