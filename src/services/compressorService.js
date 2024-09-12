import sharp from 'sharp';
import Product from '../models/productModel.js';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Worker } from 'worker_threads';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const processImageInWorker = (imageUrl, outputPath) => {
    return new Promise((resolve, reject) => {
        // Create a new worker for each image processing task
        const worker = new Worker(path.join(__dirname, './imageWorker.js'), {
            workerData: { imageUrl, outputPath }
        });

        worker.on('message', resolve); // Resolve the promise when the worker completes the task
        worker.on('error', reject);    // Reject if the worker encounters an error
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
};

const processImages = async (records, requestId) => {
    const processedResults = [];

    // Process records in parallel
    const recordPromises = records.map(async (record) => {
        const inputUrls = record.InputImageUrls.split(',');
        const outputUrls = [];

        // Ensure the processed directory exists
        const processedDir = path.join(__dirname, '../../processed');
        if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
        }

        // Process each image URL in parallel using workers
        const imagePromises = inputUrls.map(async (url) => {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                const outputPath = path.join(processedDir, path.basename(url));
                // Call worker to process image
                const result = await processImageInWorker(buffer, outputPath);
                outputUrls.push(result.outputPath);
                return outputPath;
            } catch (error) {
                console.error(`Failed to process image ${url}:`, error);
                return null; // Skip on error
            }
        });

        // Wait for all images in the record to be processed
        const processedUrls = await Promise.all(imagePromises);

        // Update the database for this record
        try {
            const updateResult = await Product.updateOne(
                { serialNumber: record.SerialNumber, requestId: requestId },
                { $set: { outputImageUrls: processedUrls, status: 'completed' } }
            );
            processedResults.push(updateResult.modifiedCount > 0);
        } catch (dbError) {
            console.error('Database update failed:', dbError);
            processedResults.push(false);
        }
    });

    // Wait for all records to be processed
    await Promise.all(recordPromises);

    // If all records are successfully processed, trigger the webhook
    if (processedResults.every(Boolean)) {
        await checkAndTriggerWebhook(requestId);
    }
};

async function checkAndTriggerWebhook(requestId) {
    try {
        const webhookUrl = process.env.WEBHOOK_URL;
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, message: 'Processing completed' })
        });
    } catch (error) {
        console.error('Webhook trigger failed:', error);
    }
}

export default processImages;
