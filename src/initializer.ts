import vertexShader from './shader/vertex.wgsl?raw';
import fragmentShader from './shader/fragment.wgsl?raw';
import imageData from './texture/wall.png';

type InitializationInput = {
    canvas: HTMLCanvasElement,
    device: GPUDevice,
    vertexSize: number,
    positionOffset: number,
    colorOffset: number,
    uvOffset: number,
    vertexArray: Float32Array<ArrayBuffer>,
    instanceNumber: number,
}

type InitializationOutput = {
    context: GPUCanvasContext,
    pipeline: GPURenderPipeline,
    verticesBuffer: GPUBuffer,
    uniformBindGroup: GPUBindGroup,
    uniformBuffer: GPUBuffer,
    depthTexture: GPUTexture,
    storageBuffer: GPUBuffer,
};

async function initialize(input: InitializationInput): Promise<InitializationOutput> {

    const { canvas, device, vertexSize, positionOffset, colorOffset, uvOffset, vertexArray, instanceNumber } = input;

    const context = canvas.getContext('webgpu') as GPUCanvasContext;

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    const devicePixelRatio = window.devicePixelRatio || 1;
    const presentationSize = [
        canvas.clientWidth * devicePixelRatio,
        canvas.clientHeight * devicePixelRatio,
    ];
    canvas.width = presentationSize[0];
    canvas.height = presentationSize[1];

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
                        {
                            // uv
                            shaderLocation: 2,
                            offset: uvOffset,
                            format: 'float32x2',
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
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
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

    // Create storage buffer
    const storageBufferSize = 4 * 16 * instanceNumber;
    const storageBuffer = device.createBuffer({
        size: storageBufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Create depth texture
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // Create texture
    const image = document.createElement('img');
    image.src = imageData;
    await image.decode();
    const imageBitmap = await createImageBitmap(image);

    const texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: texture },
        [imageBitmap.width, imageBitmap.height]
    );

    // Create sampler
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
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
            {
                binding: 1,
                resource: texture.createView(),
            },
            {
                binding: 2,
                resource: sampler,
            },
            {
                binding: 3,
                resource: {
                    buffer: storageBuffer,
                }
            }
        ],
    });

    return { context, pipeline, verticesBuffer, uniformBindGroup, uniformBuffer, depthTexture, storageBuffer };
}

export { initialize };
