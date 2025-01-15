const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const OSS = require('ali-oss');

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

const client = new OSS({
    region: 'oss-cn-hangzhou', // 替换为你的OSS区域
    accessKeyId: 'your_access_key_id', // 替换为你的AccessKey ID
    accessKeySecret: 'your_access_key_secret', // 替换为你的AccessKey Secret
    bucket: 'your_bucket_name' // 替换为你的存储桶名称
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

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({error: 'No file uploaded'});
    }
    const index = req.query.index;
    if (!index) {
        return res.status(400).json({error: 'Index is required'});
    }
    const filename = `video_${index}.mp4`;
    try {
        const result = await client.put(filename, req.file.buffer);
        res.json({message: 'File uploaded successfully', url: result.url});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Failed to upload file'});
    }
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

app.get('/preview', async (req, res) => {
    const filename = req.query.filename;
    try {
        const url = await client.signatureUrl(filename, {expires: 3600}); // 生成预览URL，有效期1小时
        res.sendFile(path.join(__dirname, 'public', 'preview.html'), {url});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Failed to generate preview URL'});
    }
});

app.get('/download/:filename', async (req, res) => {
    const filename = req.params.filename;
    try {
        const url = await client.signatureUrl(filename, {expires: 3600}); // 生成下载URL，有效期1小时
        res.redirect(url); // 重定向到下载URL
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Failed to generate download URL'});
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
