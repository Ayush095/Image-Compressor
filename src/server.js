
import multer from 'multer';
import dotenv from "dotenv";

import connectDB from './config/db.js';
import express from 'express';

const app = express();

dotenv.config({
     "path": "../.env"
});

const fileUpload = multer({ dest: 'uploads/' });

import uploadFileController from "./api/uploadFileController.js";
import statusCheckController from './api/statusCheckController.js';

const PORT = 3000;

app.use(express.json());

// Routes
app.post('/upload', fileUpload.single('file'), uploadFileController);
app.get('/status/:requestId', statusCheckController);

app.post('/webhook', (req, res) => {
    console.log('Received webhook:', req.body);
    res.status(200).send('Webhook received!');
});

connectDB()
// Server Listening
app.listen(PORT, () => {
    console.log("Server is Successfully up on", PORT);
})