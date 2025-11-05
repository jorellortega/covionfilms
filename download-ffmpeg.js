const fs = require('fs');
const https = require('https');
const path = require('path');

const ffmpegVersion = '0.12.6';
const baseUrl = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${ffmpegVersion}/dist/`;
const files = [
  'ffmpeg-core.js',
  'ffmpeg-core.wasm',
  'ffmpeg-core.worker.js'
];

const publicDir = path.join(__dirname, 'public', 'ffmpeg');

// Create directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file if there was an error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAll() {
  console.log('🚀 Downloading FFmpeg core files...');
  
  for (const file of files) {
    const url = baseUrl + file;
    const filepath = path.join(publicDir, file);
    
    try {
      console.log(`📥 Downloading ${file}...`);
      await downloadFile(url, filepath);
      console.log(`✅ Downloaded ${file}`);
    } catch (error) {
      console.error(`❌ Failed to download ${file}:`, error.message);
    }
  }
  
  console.log('\n🎉 FFmpeg download complete!');
  console.log(`📁 Files saved to: ${publicDir}`);
  console.log('\n📋 Next steps:');
  console.log('1. Update upload page to use local files');
  console.log('2. Test upload functionality');
}

downloadAll().catch(console.error);
