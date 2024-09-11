import sharp from 'sharp';
import Product from '../models/productModel.js';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const processImages = async (records, requestId) => {
    const processedResults = [];

    for (const record of records) {
        console.log(record)
        const inputUrls = record.InputImageUrls.split(',');
        const outputUrls = [];

        for (const url of inputUrls) {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const processedDir = path.join(__dirname, '../../processed');
                if (!fs.existsSync(processedDir)) {
                    fs.mkdirSync(processedDir, { recursive: true });
                }
                const outputPath = path.join(processedDir, path.basename(url));

                await sharp(buffer)
                    .jpeg({ quality: 50 })
                    .toFile(outputPath);
                
                outputUrls.push(outputPath);
            } catch (error) {
                console.error(`Failed to process image ${url}:`, error);
                continue; // Skip to next URL or handle as needed
            }
        }

        try {
            const updateResult = await Product.updateOne(
                { serialNumber: record.SerialNumber, requestId: requestId },
                { $set: { outputImageUrls: outputUrls, status: 'completed' } }
            );
            processedResults.push(updateResult.modifiedCount > 0);
        } catch (dbError) {
            console.error('Database update failed:', dbError);
            processedResults.push(false);
        }
        
    }

    if (processedResults.every(Boolean)) {
        await checkAndTriggerWebhook(requestId);
    }
};

async function checkAndTriggerWebhook(requestId) {
    try {
        //We can check the console to see the webhook flow for the user.
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
