const { MongoClient } = require('mongodb');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // 将文件存储到本地 uploads 文件夹
const cloudinary = require('cloudinary').v2;
const fs = require('fs'); // 改进错误处理逻辑

// 配置 Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // 从环境变量中读取 Cloudinary 配置
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uri = process.env.MONGODB_URI; // 从环境变量中读取 MongoDB 连接字符串
const client = new MongoClient(uri);

module.exports = async (req, res) => {
    try {
        // 添加 CORS 支持
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'OPTIONS') {
            res.status(204).end(); // 处理预检请求
            return;
        }

        if (req.method === 'POST' && req.headers['content-type'].includes('multipart/form-data')) {
            // 处理文件上传
            upload.single('file')(req, res, async (err) => {
                if (err) {
                    console.error('文件上传失败:', err);
                    return res.status(500).json({ message: '文件上传失败', error: err.message });
                }

                const filePath = req.file.path;
                try {
                    // 上传文件到 Cloudinary
                    const result = await cloudinary.uploader.upload(filePath, {
                        folder: 'experiment-files',
                    });

                    // 删除本地文件
                    fs.unlinkSync(filePath);

                    res.status(201).json({ message: '文件上传成功', fileUrl: result.secure_url });
                } catch (uploadError) {
                    console.error('Cloudinary 上传失败:', uploadError);

                    // 如果 Cloudinary 上传失败，保留本地文件作为备份
                    const backupPath = `uploads/${req.file.filename}`;
                    fs.renameSync(filePath, backupPath);

                    res.status(500).json({
                        message: '文件上传到 Cloudinary 失败，已备份到本地',
                        error: uploadError.message,
                        backupPath: backupPath,
                    });
                }
            });
            return;
        }

        await client.connect();
        const db = client.db('experiment'); // 数据库名称
        const collection = db.collection('progress-data'); // 集合名称

        if (req.method === 'GET') {
            const data = await collection.find({}).toArray();
            res.status(200).json(data);
        } else if (req.method === 'POST') {
            const newData = req.body;
            await collection.updateOne(
                { _id: newData._id }, // 假设每个成员有唯一的 `_id`
                { $set: newData },
                { upsert: true } // 如果不存在则插入
            );
            res.status(201).json({ message: '数据保存成功' });
        } else {
            res.status(405).json({ message: '方法不被允许' });
        }
    } catch (error) {
        console.error('Error in API handler:', error);
        res.status(500).json({ message: '内部服务器错误', error: error.message });
    } finally {
        await client.close();
    }
};