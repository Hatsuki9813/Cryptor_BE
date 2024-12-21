import express, { json, response } from 'express'
import mysql from 'mysql'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import moment from 'moment'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import multer from 'multer';
import nodemailer from 'nodemailer'
import bodyParser from 'body-parser'
// Khởi tạo app Express
const app = express();
app.use(cors());
app.use(bodyParser.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Kết nối MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Tên user mặc định trong XAMPP
    password: '', // Mật khẩu MySQL (để trống nếu chưa cài đặt)
    database: 'uitcine_db', // Tên cơ sở dữ liệu
});
app.get('/', (re, res) => {
    return res.json("from backend")
})
// Kiểm tra kết nối
db.connect((err) => {
    if (err) {
        console.error('Không thể kết nối MySQL:', err.message);
        return;
    }
    console.log('Đã kết nối MySQL!');
});
app.get('/api/films/:statusId', (req, res) => {
    const { statusId } = req.params;
    const query = 'SELECT * FROM films WHERE status_id = ?';

    db.query(query, [statusId], (err, results) => {
        if (err) {
            console.error('Error fetching films:', err);
            return res.status(500).json({ success: false, message: "Error fetching films", error: err.message });
        }
        return res.json(results);
    });
});
// API Endpoint: Đăng ký người dùng
app.post('/api/signup', (req, res) => {
    const data = req.body;
    const query = `
        INSERT INTO users (username, password, email, phone_number, avatar, dob, display_name)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [data.username, data.password, data.email, "", "", "", ""];

    db.query(query, params, (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, message: "Error during signup", error });
        }
        return res.json({ success: true, message: "User registered successfully" });
    });
});

// Đăng nhập người dùng
app.post('/api/signin', (req, res) => {
    const data = req.body;
    const query = `
        SELECT * FROM users
        WHERE username = ? AND password = ?
    `;
    const params = [data.username, data.password];

    db.query(query, params, (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, message: "Error during login", error });
        }
        if (results.length > 0) {
            return res.json({ success: true, message: "Login successful" });
        } else {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    });
});


// Lấy danh sách rạp theo tỉnh
app.get('/api/cinemas/:provinceId', (req, res) => {
    const provinceId = req.params.provinceId;
    const query = `SELECT * FROM cinemas WHERE province_id = ?`;

    db.query(query, [provinceId], (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, message: "Error fetching cinemas", error });
        }
        return res.json(results);
    });
});

// Lấy danh sách tỉnh
app.get('/api/provinces', (req, res) => {
    const query = `SELECT * FROM provinces`;

    db.query(query, (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, message: "Error fetching provinces", error });
        }
        return res.json(results);
    });
});

// Lấy lịch chiếu theo phim và rạp
app.get('/api/showtimes', (req, res) => {
    const { province_id, cinema_id, film_id } = req.query;
    const query = cinema_id
        ? `
            SELECT films.id AS film_id, films.name AS film_name, films.format AS film_format, films.poster AS film_poster,
            cinemas.id AS cinema_id, cinemas.name AS cinema_name, theaters.id AS theater_id, theaters.name AS theater_name,
            theaters.format AS theater_format, theaters.row AS theater_row, theaters.col AS theater_col,
            showtime_details.id AS showtime_id, showtime_details.showtime, showtime_details.format
            FROM showtime_details
            INNER JOIN cinemas ON showtime_details.cinema_id = cinemas.id
            INNER JOIN theaters ON showtime_details.theater_id = theaters.id
            INNER JOIN films ON showtime_details.film_id = films.id
            WHERE film_id = ? AND cinemas.id = ?
          `
        : `
            SELECT films.id AS film_id, films.name AS film_name, films.format AS film_format, films.poster AS film_poster,
            cinemas.id AS cinema_id, cinemas.name AS cinema_name, theaters.id AS theater_id, theaters.name AS theater_name,
            theaters.format AS theater_format, theaters.row AS theater_row, theaters.col AS theater_col,
            showtime_details.id AS showtime_id, showtime_details.showtime, showtime_details.format
            FROM showtime_details
            INNER JOIN cinemas ON showtime_details.cinema_id = cinemas.id
            INNER JOIN theaters ON showtime_details.theater_id = theaters.id
            INNER JOIN films ON showtime_details.film_id = films.id
            WHERE film_id = ? AND province_id = ?
          `;
    const params = cinema_id ? [film_id, cinema_id] : [film_id, province_id];

    db.query(query, params, (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, message: "Error fetching showtimes", error });
        }
        return res.json(results);
    });
});

app.get('/api/sold-seats/:showtimeId', (req, res) => {
    const showtimeId = req.params.showtimeId;
    const query = `SELECT seat_id FROM sold_seats WHERE showtime_id = ?`;
    db.query(query, [showtimeId], (error, results) => {
        if (error) {
            return res.status(500).json({ success: false, message: "Error fetching sold_seat", error });
        }
        return res.json(results);
    });

});

// API endpoints: Get promotion details by coupon code
app.get('/api/promotion/:coupon', (req, res) => {
    const coupon = req.params.coupon;
    const query = `SELECT * FROM coupons WHERE coupon = ?`;
    db.query(query, [coupon], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.json(results);
    });
});

// API endpoints: lấy ticket price
app.get('/api/ticket-price/:ticketId', (req, res) => {
    const ticketId = req.params.ticketId;
    const query = `SELECT * FROM tickets WHERE id = ?`;
    db.query(query, [ticketId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.json(results);
    })
});
//API endpoint: thêm 1 order
app.post('/api/add-order', (req, res) => {
    const data = req.body;

    const query1 = `
        INSERT INTO orders ( price, showtime_id, username, used, seats, day) VALUES ( ?, ?, ?, ?, ?, ?)
    `;
    const params1 = [
        //data.id,
        data.price,
        data.showtime_id,
        data.username,
        0,
        data.seats.join(', '),
        data.day
    ];

    // Insert orders
    db.query(query1, params1, (error) => {
        if (error) {
            console.error('Error adding order:', error);
            return res.status(500).json({ error: error.message });
        }

        // Insert sold seats
        const seatPromises = [];
        data.seats.forEach((seat) => {
            const query2 = `INSERT INTO sold_seats (showtime_id, seat_id) VALUES (?, ?)`;
            const params2 = [data.showtime_id, seat];
            
            seatPromises.push(
                new Promise((resolve, reject) => {
                    db.query(query2, params2, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                })
            );
        });

        Promise.all(seatPromises)
            .then(() => res.json({ message: 'Order added successfully' }))
            .catch((error) => {
                console.error('Error adding seats:', error);
                res.status(500).json({ error: error.message });
            });
    });
});


// Mark ticket as used
app.patch('/api/use-ticket/:orderId', (req, res) => {
    const orderId = req.params.orderId;
    const query = `UPDATE orders SET used = 1 WHERE id = ?`;
    db.query(query, [orderId], (error, results) => {
        if (error) {
            res.status(500).json({ error: error.message });
        }
        res.json({ message: 'Ticket marked as used' });
    });
});

// Get user information by username
app.get('/api/user/:username', (req, res) => {
    const username = req.params.username;
    const query = `SELECT * FROM users WHERE username = ?`;
    db.query(query, [username], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message })
        }
        return res.json(results);
    });
});

// Get user tickets by username and ticket type
app.get('/api/user-tickets/:username/:ticketType', (req, res) => {
    const { username, ticketType } = req.params;
    const query = `
            SELECT * FROM orders WHERE username = ? AND used = ?
            ORDER BY day DESC
            LIMIT 30
        `;
    db.query(query, [username, ticketType], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message })
        }
        return res.json(results);
    });

});


// Lấy thông tin showtime
app.get('/api/showtime/:showtimeId', (req, res) => {
    const showtimeId = req.params.showtimeId;
    const query = `
        SELECT
            films.poster AS film_poster,
            films.name AS film_name,
            films.format AS film_format,
            films.duration AS film_duration,
            films.age_rating AS film_ageRating,
            showtime_details.format AS format,
            cinemas.name AS cinema_name,
            showtime_details.showtime AS showtime,
            theaters.format AS theater_format,
            theaters.name AS theater_name
        FROM showtime_details
        INNER JOIN cinemas ON showtime_details.cinema_id = cinemas.id
        INNER JOIN films ON showtime_details.film_id = films.id
        INNER JOIN theaters ON showtime_details.theater_id = theaters.id
        WHERE showtime_details.id = ?
    `;

    db.query(query, [showtimeId], (error, results) => {
        if (error) {

            return res.status(500).json({ error: error.message });

        }
        return res.json(results);
    });
});

app.put('/api/update-user', (req, res) => {
    const { field, value, username } = req.body;

    const query = `
        UPDATE users 
        SET ${field} = ? 
        WHERE username = ?
    `;

    db.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        db.query(query, [value, username], (error, results) => {
            if (error) {
                return db.rollback(() => {
                    res.status(500).json({ error: error.message });
                });
            }

            db.commit((commitError) => {
                if (commitError) {
                    return db.rollback(() => {
                        res.status(500).json({ error: commitError.message });
                    });
                }
                res.json({
                    success: true,
                    message: "User information updated successfully"
                });
            });
        });
    });
});

app.put('/api/usedticket/:order_id', (req, res) => {
    const { order_id } = req.params;
    const query = `
        UPDATE orders
        SET used = 1
        WHERE id = ?
    `;
    db.query(query, [order_id], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message })
        }
        return res.json(results);
    });

});
app.get('/api/cinemashowtimes/:cinema_id', (req, res) => {
    const { cinema_id } = req.params;

    const query = `
        SELECT
            films.id AS film_id,
            films.name AS film_name,
            films.format AS film_format,
            films.poster AS film_poster,
            films.duration AS film_duration,
            films.age_rating AS film_ageRating,
            theaters.id AS theater_id,
            theaters.name AS theater_name,
            theaters.format AS theater_format,
            theaters.row AS theater_row,
            theaters.col AS theater_col,
            showtime_details.id AS showtime_id, 
            showtime_details.showtime,
            showtime_details.format
        FROM showtime_details
        INNER JOIN theaters ON showtime_details.theater_id = theaters.id
        INNER JOIN films ON showtime_details.film_id = films.id
        WHERE showtime_details.cinema_id = ?
    `;

    db.query(query, [cinema_id], (error, results) => {
        if (error) {
            console.error('Error fetching cinema showtimes:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.json(results);
    });
});
// Chạy server */
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
