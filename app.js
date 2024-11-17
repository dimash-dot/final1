require('dotenv').config(); // Загрузка переменных окружения из .env
const express = require('express');
const path = require('path'); // Добавьте эту строку
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const checkRole = require('./middleware/checkRole'); // Middleware для проверки роли
const sendEmail = require('./emailService'); // Функция отправки email

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для обработки JSON и URL-encoded данных
app.use(express.json()); // Обработка JSON тела запроса
app.use(express.urlencoded({ extended: true })); // Обработка данных из форм

// Настройка шаблонизатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public')); // укажите папку для статических файлов

// Подключение к MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware для проверки токена и добавления данных пользователя в запрос
app.use((req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', ''); // Извлечение токена из заголовка
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Декодирование токена
            req.user = decoded; // Сохранение данных пользователя в объекте запроса
        } catch (error) {
            console.error('Token verification error:', error.message);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
    }
    next(); // Передача управления следующему middleware
});

// Подключение маршрутов
const authRoutes = require('./routes/auth'); // Роуты для аутентификации
const portfolioRoutes = require('./routes/portfolio'); // Роуты для портфолио
const financeRoutes = require('./routes/finance'); // Роуты для финансов
const nutritionRoutes = require('./routes/nutrition'); // Роуты для Nutritionix API

// Использование маршрутов
app.use('/auth', authRoutes); // Аутентификация
app.use('/portfolio', portfolioRoutes); // Портфолио
app.use('/api/finance', financeRoutes); // Финансовые данные
app.use('/api/nutrition', nutritionRoutes); // Данные о питании

// Пример защищённого маршрута для админов
app.get('/admin', checkRole('admin'), (req, res) => {
    res.send('Welcome Admin!');
});

// Пример защищённого маршрута для уведомлений
app.post('/api/portfolio', async (req, res) => {
    const { action, itemData } = req.body; // Пример данных

    // Логика создания или обновления элемента
    if (action === 'create' || action === 'update') {
        try {
            // Отправка email при создании или обновлении
            await sendEmail(
                'admin@example.com',  // Email получателя
                `${action.charAt(0).toUpperCase() + action.slice(1)} Portfolio Item`,
                `A portfolio item has been ${action}.\nItem data: ${JSON.stringify(itemData)}`
            );
            res.status(200).send('Item processed');
        } catch (error) {
            console.error('Error sending email:', error.message);
            res.status(500).send('Failed to send email');
        }
    } else {
        res.status(400).send('Invalid action');
    }
});

// Обработка неудачных попыток входа
let loginAttempts = {};

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(400).send('User not found');
    }

    // Проверка блокировки
    if (user.isLockedOut()) {
        return res.status(403).send('Your account is locked. Try again later');
    }

    // Проверка пароля с использованием bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password); // Используем bcrypt для сравнения

    if (!isPasswordValid) {
        // Увеличиваем количество попыток входа
        loginAttempts[username] = loginAttempts[username] || 0;
        loginAttempts[username] += 1;

        if (loginAttempts[username] >= 3) {
            // Отправка уведомления, если три неудачные попытки
            try {
                await sendEmail(
                    'admin@example.com',  // Адрес для уведомления
                    '3 Failed Login Attempts',
                    `User ${username} has failed to log in 3 times.`
                );
                loginAttempts[username] = 0; // Сбросить счетчик после отправки уведомления
            } catch (error) {
                console.error('Error sending email for login attempts:', error.message);
            }
        }

        return res.status(400).send('Invalid credentials');
    }

    // Сбросить счетчик неудачных попыток после успешного входа
    loginAttempts[username] = 0;

    // Генерация JWT токена
    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });

    res.status(200).json({ token });
});

// Главная страница
app.get('/', (req, res) => {
    res.send('Welcome to the Portfolio Platform');
});

// Запуск сервера
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
