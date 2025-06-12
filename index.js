const express = require('express');
const bodyParser = require('body-parser');
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');
const path = require('path');
const multer = require('multer');
const { match } = require('assert');


// Setup
const app = express();
const upload = multer({
    limits: {
        fieldSize: 50 * 1024 * 1024
    }
});
app.use(express.json());
app.use(upload.none());

const PORT = 3000;
app.use(bodyParser.json()); // allow large base64 images

// Patch face-api with canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Load models
const MODEL_PATH = path.join(__dirname, 'models');
async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
}
loadModels();

// Helper to decode base64 to Image
async function base64ToImage(base64) {
    const buffer = Buffer.from(base64, 'base64');
    return await canvas.loadImage(buffer);
}

app.get('/', async (req, res) => {
    try {
        return res.status(200).json({
            "status": "ok"
        })
    } catch (error) {
        return res.status(500).json({
            "status": "error"
        })
    }
});

// ✅ Custom error handler (must come after your routes)
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'The image size is too large. Please upload smaller images (under 50MB).' });
    }

    // Handle other errors
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Compare endpoint
app.post('/compare', async (req, res) => {
    try {
        const { face1, face2 } = req.body; // Expect base64 strings (no data:image/... prefix)

        if (!face1 || !face2) {
            return res.status(400).json({
                match: false,
                distance: null,
                threshold: threshold,
                message: 'Both face1 and face2 base64 strings are required.'
            });
        }

        const img1 = await base64ToImage(face1);
        const img2 = await base64ToImage(face2);

        const desc1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
        const desc2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();

        if (!desc1 || !desc2) {
            return res.status(400).json({
                match: false,
                distance: null,
                threshold: null,
                message: 'Could not detect face in one or both images.'
            });
        }

        const threshold = 0.6;
        const distance = faceapi.euclideanDistance(desc1.descriptor, desc2.descriptor);
        const isMatch = distance < threshold;

        console.log("faces is match, with distance ", distance)
        res.json({
            match: isMatch,
            distance: distance,
            threshold: threshold,
            message: isMatch ? 'Face matched. Attendance confirmed.' : 'Face did not match.'
        });

    } catch (err) {
        console.error("error: ", err.type);
        res.status(500).json({
            match: false,
            distance: null,
            threshold: null,
            message: err.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Face API (base64 version) running at http://localhost:${PORT}`);
});
