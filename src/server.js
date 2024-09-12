import multer from 'multer';
import dotenv from "dotenv";
import connectDB from './config/db.js';
import express from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Load environment variables from .env file
dotenv.config({
     "path": "../.env"
});

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer to use the uploads directory
const fileUpload = multer({ dest: uploadDir });

import uploadFileController from "./api/uploadFileController.js";
import statusCheckController from './api/statusCheckController.js';

const PORT = 3000;

app.use(express.json());

// Routes
app.post('/upload', fileUpload.single('file'), uploadFileController);
app.get('/status/:requestId', statusCheckController);

app.post('/webhook', (req, res) => {
    console.log('Received webhook:', req.body);
});

connectDB();
// Server Listening
app.listen(PORT, () => {
    console.log("Server is Successfully up on", PORT);
});
