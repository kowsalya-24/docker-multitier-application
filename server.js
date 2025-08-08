const express = require('express');
const mysql = require('mysql2/promise');
const redis = require('redis');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- Database Connection (MySQL) ---
let pool;
async function connectToMySQL() {
    try {
        pool = mysql.createPool({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        await pool.getConnection(); // Test the connection
        console.log('Connected to MySQL database!');
    } catch (err) {
        console.error('Error connecting to MySQL:', err);
        // Implement exponential backoff for retries
        setTimeout(connectToMySQL, 5000);
    }
}

// --- Cache Connection (Redis) ---
let redisClient;
async function connectToRedis() {
    try {
        redisClient = redis.createClient({
            url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
        });
        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        await redisClient.connect();
        console.log('Connected to Redis cache!');
    } catch (err) {
        console.error('Error connecting to Redis:', err);
        // Implement exponential backoff for retries
        setTimeout(connectToRedis, 5000);
    }
}

// Connect to services
connectToMySQL();
connectToRedis();

// --- API Endpoints ---
app.post('/api/user', async (req, res) => {
    try {
        const { name, age, dob, city, pincode, country, phone, pii } = req.body;
        
        // Determine status (Minor or Major)
        const status = parseInt(age, 10) < 18 ? 'Minor' : 'Major';

        const [result] = await pool.execute(
            'INSERT INTO users (name, age, dob, city, pincode, country, phone, pii, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, age, dob, city, pincode, country, phone, pii, status]
        );

        const newUser = { id: result.insertId, name, age, dob, city, pincode, country, phone, pii, status };

        // Cache the new user data in Redis
        await redisClient.set(`user:${newUser.id}`, JSON.stringify(newUser), {
            EX: 3600 // Cache for 1 hour
        });

        console.log(`New user created with ID: ${newUser.id}`);
        res.status(201).send({ message: 'User data saved successfully!', user: newUser });
    } catch (err) {
        console.error('Error saving user data:', err);
        res.status(500).send({ message: 'Error saving user data.' });
    }
});

app.get('/api/user/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        // Try to get data from Redis cache first
        const cachedUser = await redisClient.get(`user:${userId}`);
        if (cachedUser) {
            console.log(`User data retrieved from Redis cache for ID: ${userId}`);
            return res.status(200).send({ message: 'User data from cache.', user: JSON.parse(cachedUser) });
        }

        // If not in cache, get from MySQL
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);

        if (rows.length > 0) {
            const user = rows[0];
            // Cache the result in Redis
            await redisClient.set(`user:${userId}`, JSON.stringify(user), {
                EX: 3600 // Cache for 1 hour
            });
            console.log(`User data retrieved from MySQL and cached for ID: ${userId}`);
            return res.status(200).send({ message: 'User data from database.', user: user });
        } else {
            return res.status(404).send({ message: 'User not found.' });
        }
    } catch (err) {
        console.error('Error retrieving user data:', err);
        res.status(500).send({ message: 'Error retrieving user data.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

