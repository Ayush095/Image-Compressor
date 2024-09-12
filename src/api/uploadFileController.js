import { parse } from 'csv-parse/sync';
import fs from 'fs';
import Product from '../models/productModel.js';
import processImages from '../services/compressorService.js';
import { v4 as uuidv4 } from 'uuid';
import util from 'util';

const unlinkFile = util.promisify(fs.unlink); // Return promise

const uploadFileController = async (req, res) => {
    try {
        const fileData = fs.readFileSync(req.file.path);
        const records = parse(fileData, { columns: true, skip_empty_lines: true });

        // Validate each record
        if (!records.every(record => record.SerialNumber && record.ProductName && record.InputImageUrls)) {
            return res.status(400).json({ error: "CSV format error: Ensure all records have SerialNumber, ProductName, and InputImageUrls fields." });
        }

        const requestId = uuidv4(); // Generate a unique ID for the whole file.

        // Insert records into the database in parallel using Promise.all
        await Promise.all(
            records.map(record =>
                Product.create({
                    serialNumber: record.SerialNumber,
                    productName: record.ProductName,
                    inputImageUrls: record.InputImageUrls.split(','),
                    requestId,
                    status: 'processing'
                })
            )
        );

        // Process images and delete file in parallel
        const processTask = processImages(records, requestId);
        const deleteTask = unlinkFile(req.file.path);

        res.json({ message: 'File processed and deleted from server', requestId });
        // Run both tasks in parallel using Promise.all
        Promise.all([processTask, deleteTask])
            .then(() => {
                console.log(`File ${req.file.path} deleted and images processed successfully.`);
            })
            .catch((err) => {
                console.error('Error during background tasks:', err);
            });

        console.log(`CSV File deleted from server and images processed successfully.`);

    } catch (err) {
        console.error('Error processing file:', err);
        res.status(500).send('Error processing file');
    }
};

export default uploadFileController;
