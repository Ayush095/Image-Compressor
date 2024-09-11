import Product from '../models/productModel.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
const statusController = async (req, res) => {
    try {
        const { requestId } = req.params;
        const products = await Product.find({ requestId }, { _id: 0 });

        if (!products || products.length === 0) {
            return res.status(404).send('Request ID not found');
        }

        // Check if all products are completed
        const allCompleted = products.every(product => product.status === 'completed');

        if (allCompleted) {
            // All products have been processed, respond with a success message or handle the CSV creation
            const csvPath = await generateCsv(products);
            res.json({ message: 'All products processed', csvPath, products });
        } else {
            // Not all products are completed, check if any are still processing
            const anyProcessing = products.some(product => product.status === 'processing');
            if (anyProcessing) {
                res.json({ message: 'Processing ongoing' });
            } else {
                res.json({ message: 'Processing complete but pending actions exist' });
            }
        }
    } catch (error) {
        console.error('Error retrieving status:', error);
        res.status(500).send('Server error');
    }

};

export default statusController

async function generateCsv(products) {
    const csvPath = path.join(__dirname, '../../outputCsv');
    if (!fs.existsSync(csvPath)) {
        fs.mkdirSync(csvPath, { recursive: true });
    }
    const csvFilePath = path.join(csvPath, 'output.csv');

    const csvWriter = createCsvWriter({
        path: csvFilePath,
        header: [
            { id: 'serialNumber', title: 'Serial Number' },
            { id: 'productName', title: 'Product Name' },
            { id: 'inputImageUrls', title: 'Input Image Urls' },
            { id: 'outputImageUrls', title: 'Output Image Urls' }
        ]
    });

    const records = products.map(product => ({
        serialNumber: product.serialNumber,
        productName: product.productName,
        inputImageUrls: product.inputImageUrls.join(','),
        outputImageUrls: product.outputImageUrls.join(',')
    }));

    await csvWriter.writeRecords(records);
    return csvFilePath;
}
