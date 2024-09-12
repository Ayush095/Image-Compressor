import { workerData, parentPort } from 'worker_threads';
import sharp from 'sharp';
import fs from 'fs';

(async () => {
    try {
        const { imageUrl, outputPath } = workerData;

        // Process the image using sharp
        await sharp(imageUrl)
            .jpeg({ quality: 50 })
            .toFile(outputPath);

        // Send the result back to the main thread
        parentPort.postMessage({ success: true, outputPath });
    } catch (error) {
        parentPort.postMessage({ success: false, error });
    }
})();
