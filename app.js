const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const UPLOAD_FOLDER = 'uploads';
const QR_CODE_FOLDER = 'qrcodes';

if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER);
}

if (!fs.existsSync(QR_CODE_FOLDER)) {
    fs.mkdirSync(QR_CODE_FOLDER);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_FOLDER);
    },
    filename: function (req, file, cb) {
        const index = req.query.index;
        if (!index) {
            return cb(new Error('Index is required'), null);
        }
        const filename = `video_${index}.mp4`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use(`/${UPLOAD_FOLDER}`, express.static(UPLOAD_FOLDER));
app.use(`/${QR_CODE_FOLDER}`, express.static(QR_CODE_FOLDER));
//app.use('/uploads', express.static(UPLOAD_FOLDER));
//app.use('/qrcodes', express.static(QR_CODE_FOLDER));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // const filePath = path.join(UPLOAD_FOLDER, req.file.filename);
    // const qrCodePath = generateQRCode(filePath);
    // res.json({ message: 'File uploaded successfully', qr_code: qrCodePath });
    res.json({ message: 'File uploaded successfully' });
});

function generateQRCode(filePath) {
    const qrCodePath = path.join(QR_CODE_FOLDER, path.basename(filePath) + '.png');
    const url = `http://localhost:${PORT}/preview?filename=${path.basename(filePath)}`;
    QRCode.toFile(qrCodePath, url, {
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, (err) => {
        if (err) throw err;
    });
    return qrCodePath;
}

app.get('/preview', (req, res) => {
    const filename = req.query.filename;
    const filePath = path.join(UPLOAD_FOLDER, filename);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // 文件不存在，返回特定的响应
            res.sendFile(path.join(__dirname, 'public', 'waiting.html'));
        } else {
            // 文件存在，返回预览页面
            res.sendFile(path.join(__dirname, 'public', 'preview.html'));
        }
    });
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    res.download(path.join(UPLOAD_FOLDER, filename), (err) => {
        if (err) {
            res.status(500).send({
                message: "Could not download the file. " + err,
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
