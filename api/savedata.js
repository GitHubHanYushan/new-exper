const { MongoClient } = require('mongodb');

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