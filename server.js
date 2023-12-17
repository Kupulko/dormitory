const express = require("express");
const mysql = require("mysql");
const bodyParser = require('body-parser');
const path = require("path");
const bcrypt = require('bcrypt');
const saltRounds = 10; // Кількість раундів для генерації солі
const multer = require("multer");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));


const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123ewqzxc",
    database: "dometory"
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/form", (req, res) => {
    res.sendFile(path.join(__dirname, "form.html"));
});

app.get("/formstyle", (req, res) => {
    res.sendFile(path.join(__dirname, "form.css"));
});

app.get("/appstyle", (req, res) => {
    res.sendFile(path.join(__dirname, "applications.css"));
});

app.get("/index", (req, res) => {
    res.sendFile(path.join(__dirname, "index.css"));
});

app.get("/signupstyle", (req, res) => {
    res.sendFile(path.join(__dirname, "signup.css"));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "signup.html"));
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Будь ласка, заповніть усі поля форми' });
    }

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Помилка сервера' });
        }

        const sql = "INSERT INTO login (name, email, password) VALUES (?, ?, ?)";
        const values = [name, email, hash]; // Зберігаємо хеш паролю, а не сам пароль

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Помилка сервера' });
            }
            console.log("Registered successfully:", result);
            res.redirect("/login");
        });
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Будь ласка, заповніть усі поля форми' });
    }

    const sql = "SELECT * FROM login WHERE email = ?";
    db.query(sql, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Помилка сервера' });
        }

        if (result.length === 0) {
            return res.status(401).json({ error: 'Невірна адреса електронної пошти або пароль' });
        }

        const user = result[0];
        bcrypt.compare(password, user.password, (err, passwordMatch) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Помилка сервера' });
            }

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Невірна адреса електронної пошти або пароль' });
            }

            // Тут ви можете ввести код для успішного входу користувача
            // Наприклад, можна створити сесію або повернути успішну відповідь
            res.redirect("/");
        });
    });
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post("/submitAccommodationForm", upload.single('documents'), (req, res) => {
    const {
        firstName,
        lastName,
        middleName,
        dob,
        specialty,
        phoneNumber,
        hostelNumber
    } = req.body;

    const documents = req.file.filename; // Ім'я файлу, яке було завантажено

    // Виконання INSERT-запиту до бази даних
    const sql = "INSERT INTO accommodation_applications (first_name, last_name, middle_name, dob, specialty, phone_number, hostel_number, documents) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    const values = [firstName, lastName, middleName, dob, specialty, phoneNumber, hostelNumber, documents];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Помилка сервера' });
        }
        console.log("Application submitted successfully:", result);
        res.status(200).json({ success: 'Заявка успішно подана' });
    });
});

app.get('/applications', (req, res) => {
    res.sendFile(path.join(__dirname, 'applications.html'));
});

app.get('/getApplications', (req, res) => {
    const sql = 'SELECT * FROM accommodation_applications';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Помилка сервера' });
        }
        res.json(results);
    });
});

app.listen(8081, () => {
    console.log("Server is running on port 8081");
});
