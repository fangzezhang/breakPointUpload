const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require("multer");

const app = express();

app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);

}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 设置文件存储的目录
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const {filename, index} = req.body;
    const chunkFilePath = `${filename}-${index}`;

    cb(null, chunkFilePath);  // 定义文件名, 会覆盖同名文件
  }
});
const upload = multer({ storage });

async function mergeChunks(fileName) {
  const chunkFiles = fs.readdirSync(UPLOAD_DIR)
    .filter(file => file.startsWith(fileName + '-'))
    .sort((a, b) => {
      const aIndex = a[a.length - 1];
      const bIndex = a[b.length - 1];

      return aIndex - bIndex;
    });
  const filePath = path.join(UPLOAD_DIR, fileName);
  const writeStream = fs.createWriteStream(filePath, {
    flags: 'w',
    encoding: 'binary',
  });

  for (let chunkFile of chunkFiles) {
    const chunkFilePath = path.join(UPLOAD_DIR, chunkFile);
    const readStream = fs.createReadStream(chunkFilePath);

    await new Promise((resolve, reject) => {
      readStream.pipe(writeStream, {end: false});
      readStream.on('end', () => resolve());
      readStream.on('error', error => reject(error));
    });

    try {
      fs.unlinkSync(chunkFilePath);  // 删除切片文件
      console.info(chunkFilePath + '删除成功');
    } catch (e) {
      console.info(e);
    }
  }

  writeStream.end();
  console.info('File merge done');
}

app.get('/', (req, res) => {
  res.status(200).sendFile(path.resolve('./index.html'));
});

/*
* 这里的 upload.array("NAME") 需要和前端传递的 file 对应的 key 一致
* */
app.post('/upload', upload.single("chunk"), (req, res) => {
  const { filename, index, totalChunks } = req.body;

  if (+index === totalChunks - 1) {
    mergeChunks(filename);
    res.status(200).send('File upload complete');
  } else {
    res.status(200).send('Chunk uploaded');
  }
});

app.listen(3000, () => {
  console.info('server open at: http://localhost:3000');
});
