const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const QR_CODE_FOLDER = 'qrcodes';
const NUM_QR_CODES = 10;
const BASE_URL = 'http://192.168.194.57:3000'; // 替换为你的实际域名或IP地址

if (!fs.existsSync(QR_CODE_FOLDER)) {
    fs.mkdirSync(QR_CODE_FOLDER);
}

for (let i = 1; i <= NUM_QR_CODES; i++) {
    const filename = `video_${i}.mp4`;
    const url = `${BASE_URL}/preview?filename=${filename}`;
    const qrCodePath = path.join(QR_CODE_FOLDER, `${filename}.png`);

    QRCode.toFile(qrCodePath, url, {
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, (err) => {
        if (err) throw err;
        console.log(`Generated QR code for ${filename}`);
    });
}
