import vertexShader from './shader/vertex.wgsl?raw';
import fragmentShader from './shader/fragment.wgsl?raw';

type InitializationInput = {
    canvas: HTMLCanvasElement,
    device: GPUDevice,
    vertexSize: number,
    positionOffset: number,
    colorOffset: number,
    vertexArray: Float32Array<ArrayBuffer>,
}

type InitializationOutput = {
    context: GPUCanvasContext,
    pipeline: GPURenderPipeline,
    verticesBuffer: GPUBuffer,
    uniformBindGroup: GPUBindGroup,
    uniformBuffer: GPUBuffer,
};

async function initialize(input: InitializationInput): Promise<InitializationOutput> {

    const { canvas, device, vertexSize, positionOffset, colorOffset, vertexArray } = input;

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
            module: device.createShaderModule({ code: vertexShader }),
            entryPoint: 'main',
            buffers: [
                {
                    // 配列の要素間の距離をバイト単位で指定します。
                    arrayStride: vertexSize,

                    // 頂点バッファの属性を指定します。
                    attributes: [
                        {
                            // position
                            shaderLocation: 0, // @location(0) in vertex shader
                            offset: positionOffset,
                            format: 'float32x4',
                        },
                        {
                            // color
                            shaderLocation: 1, // @location(1) in vertex shader
                            offset: colorOffset,
                            format: 'float32x4',
                        },
                    ],
                },
            ],
        },
        fragment: {
            module: device.createShaderModule({ code: fragmentShader }),
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

    // Create a vertex buffer from the  data.
    const verticesBuffer = device.createBuffer({
        size: vertexArray.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });

    new Float32Array(verticesBuffer.getMappedRange()).set(vertexArray);
    verticesBuffer.unmap();

    // Create uniform buffer
    const uniformBufferSize = 4 * 16 * 3; // 4x4 matrix * 3
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create bind group
    const uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0, // @binding(0) in shader
                resource: {
                    buffer: uniformBuffer
                },
            },
        ],
    });

    return { context, pipeline, verticesBuffer, uniformBindGroup, uniformBuffer };
}

export { initialize };
