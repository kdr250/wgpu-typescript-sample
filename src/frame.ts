
type DrawInput = {
    device: GPUDevice,
    context: GPUCanvasContext,
    pipeline: GPURenderPipeline,
    verticesBuffer: GPUBuffer,
    indicesBuffer: GPUBuffer,
    quadIndexArray: Uint16Array<ArrayBuffer>,
};

function drawFrame(input: DrawInput) {
    const { device, context, pipeline, verticesBuffer, indicesBuffer, quadIndexArray } = input;

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
    };
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setVertexBuffer(0, verticesBuffer);
    passEncoder.setIndexBuffer(indicesBuffer, 'uint16');
    passEncoder.drawIndexed(quadIndexArray.length);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);

    const callback = drawCallback(input);
    requestAnimationFrame(callback);
}

function drawCallback(input: DrawInput): () => void {
    return drawFrame.bind(drawFrame, input);
}

export { drawCallback };
