import { mat4, vec3 } from 'gl-matrix';

type DrawInput = {
    device: GPUDevice,
    context: GPUCanvasContext,
    pipeline: GPURenderPipeline,
    verticesBuffer: GPUBuffer,
    vertexCount: number,
    uniformBindGroup: GPUBindGroup,
    uniformBuffer: GPUBuffer,
    depthTexture: GPUTexture,
    instancePositions: Float32Array<ArrayBuffer>,
    instanceBuffer: GPUBuffer,
};

function drawFrame(input: DrawInput) {
    const { device, context, pipeline, verticesBuffer, vertexCount, uniformBindGroup, uniformBuffer, depthTexture, instancePositions, instanceBuffer } = input;

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
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    getTransformationMatrix(device, uniformBuffer);

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setVertexBuffer(0, verticesBuffer);
    passEncoder.setVertexBuffer(1, instanceBuffer);
    passEncoder.draw(vertexCount, Math.floor(instancePositions.length / 2));
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);

    const callback = drawCallback(input);
    requestAnimationFrame(callback);
}

function drawCallback(input: DrawInput): () => void {
    return drawFrame.bind(drawFrame, input);
}

function getTransformationMatrix(device: GPUDevice, uniformBuffer: GPUBuffer) {
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, 1, 1, 100.0);
    device.queue.writeBuffer(
        uniformBuffer,
        4 * 16 * 0,
        projectionMatrix.buffer,
        projectionMatrix.byteOffset,
        projectionMatrix.byteLength
    );

    const viewMatrix = mat4.create();
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -4));
    device.queue.writeBuffer(
        uniformBuffer,
        4 * 16 * 1,
        viewMatrix.buffer,
        viewMatrix.byteOffset,
        viewMatrix.byteLength
    );

    const worldMatrix = mat4.create();
    const now = Date.now() / 1000;
    mat4.rotate(worldMatrix, worldMatrix, 1, vec3.fromValues(Math.sin(now), Math.cos(now), 0));
    device.queue.writeBuffer(
        uniformBuffer,
        4 * 16 * 2,
        worldMatrix.buffer,
        worldMatrix.byteOffset,
        worldMatrix.byteLength
    );
}

export { drawCallback };
