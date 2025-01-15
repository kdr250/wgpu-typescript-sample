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
};

function draw(input: DrawInput, index: number) {
    const { device, context, pipeline, verticesBuffer, vertexCount, uniformBindGroup, uniformBuffer, depthTexture } = input;

    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'load',
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

    getTransformationMatrix(device, uniformBuffer, index);

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setVertexBuffer(0, verticesBuffer);
    passEncoder.draw(vertexCount);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
}

function drawFrame(input: DrawInput) {
    for (let index = 0; index < 30 * 30; index++) {
        draw(input, index);
    }

    const callback = drawCallback(input);
    requestAnimationFrame(callback);
}

function drawCallback(input: DrawInput): () => void {
    return drawFrame.bind(drawFrame, input);
}

function getTransformationMatrix(device: GPUDevice, uniformBuffer: GPUBuffer, index: number) {
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, (2 * Math.PI) / 5, 1, 1, 1000.0);
    device.queue.writeBuffer(
        uniformBuffer,
        4 * 16 * 0,
        projectionMatrix.buffer,
        projectionMatrix.byteOffset,
        projectionMatrix.byteLength
    );

    const viewMatrix = mat4.create();
    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(28, -24, -110));
    device.queue.writeBuffer(
        uniformBuffer,
        4 * 16 * 1,
        viewMatrix.buffer,
        viewMatrix.byteOffset,
        viewMatrix.byteLength
    );

    const worldMatrix = mat4.create();
    const now = Date.now() / 1000;
    mat4.translate(
        worldMatrix,
        worldMatrix,
        vec3.fromValues((index % 30) * 5 - 100, Math.floor(index / 30) * 5 + -50, 0)
    );
    mat4.rotate(
        worldMatrix,
        worldMatrix,
        1,
        vec3.fromValues(Math.sin(now), Math.cos(now), 0)
    );

    device.queue.writeBuffer(
        uniformBuffer,
        4 * 16 * 2,
        worldMatrix.buffer,
        worldMatrix.byteOffset,
        worldMatrix.byteLength
    );
}

export { drawCallback };
