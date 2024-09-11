import { parse } from 'csv-parse/sync';
import fs from 'fs';
import Product from '../models/productModel.js';
import processImages from '../services/compressorService.js';
import { v4 as uuidv4 } from 'uuid';

const uploadController = async (req, res) => {
    try {
        const fileData = fs.readFileSync(req.file.path);
        const records = parse(fileData, { columns: true, skip_empty_lines: true });

        // Validate each record
        if (!records.every(record => record.SerialNumber && record.ProductName && record.InputImageUrls)) {
            return res.status(400).json({ error: "CSV format error: Ensure all records have SerialNumber, ProductName, and InputImageUrls fields." });
        }

        const requestId = uuidv4(); // Generate a unique ID for the whole file.

        records.forEach(async (record) => {
            await Product.create({
                serialNumber: record.SerialNumber,
                productName: record.ProductName,
                inputImageUrls: record.InputImageUrls.split(','),
                requestId,
                status: 'processing'
            });
        });

        setTimeout(() => {
            processImages(records, requestId); // Process images asynchronously.
        }, 100000); // Timeout set for 100,000 ms (100 seconds)

        res.json({ message: 'File is being processed & Deleted From Server', requestId });
    } catch (err) {
        console.error('Error processing file:', err);
        res.status(500).send('Error processing file');
    }
};

export default uploadController;
