const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const checkRole = require('../middleware/checkRole'); // Для проверки роли пользователя

const router = express.Router();

// Nodemailer настройка
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Регистрация пользователя
router.post('/register', async (req, res) => {
    const { username, password, firstName, lastName, age, gender, is2FAEnabled, role } = req.body;

    const is2FAEnabledBool = is2FAEnabled === 'on';

    try {
        // Проверка на уникальность имени пользователя
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        let twoFactorSecret = null;
        let otpauthUrl = null;
        if (is2FAEnabledBool) {
            // Генерация секретного ключа для 2FA
            const secret = speakeasy.generateSecret();
            twoFactorSecret = secret.base32;  // Секретный ключ для 2FA
            otpauthUrl = secret.otpauth_url;  // Ссылка для настройки в Google Authenticator
        }

        // Хэширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Создание нового пользователя
        const user = new User({
            username,
            password: hashedPassword,
            firstName,
            lastName,
            age,
            gender,
            is2FAEnabled: is2FAEnabledBool,
            role: role || 'editor', // Убедитесь, что роль передается, если не передана - дефолтная 'editor'
            twoFactorSecret,
            failedLoginAttempts: 0,
            lockedAt: null,
        });

        // Сохранение пользователя в базе данных
        await user.save();

        // Отправка письма с инструкцией по 2FA
        if (is2FAEnabledBool) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: username,
                subject: 'Set up Two-Factor Authentication',
                text: `Hello ${firstName},\n\nTo set up two-factor authentication, please follow these steps:\n\n1. Install Google Authenticator on your device.\n2. Open the app and choose "Enter setup key".\n3. Use the following secret key to complete the setup:\n\nSecret Key: ${twoFactorSecret}\n\nThank you for securing your account with 2FA!`,
            });
        }

        // Отправка приветственного письма
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: username,
            subject: 'Welcome to Portfolio Platform',
            text: `Hello ${firstName}, welcome to our platform! Your account has been successfully created.`,
        });

        res.status(201).json({ message: 'User registered successfully. Please check your email for 2FA setup instructions.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Вход пользователя
router.post('/login', async (req, res) => {
    const { username, password, twoFACode } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Проверка блокировки
        if (user.isLockedOut()) {
            return res.status(403).json({ error: 'Account is locked. Please try again later.' });
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            // Увеличиваем количество неудачных попыток
            await user.incrementFailedLoginAttempts();
            await user.save();

            if (user.failedLoginAttempts >= 3) {
                user.lockedAt = Date.now();
                await user.save();

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: user.username,
                    subject: 'Account Locked',
                    text: `Your account has been locked due to multiple failed login attempts. Please try again after 30 minutes.`,
                });
            }

            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Сброс неудачных попыток при успешном входе
        user.failedLoginAttempts = 0;
        await user.save();

        // Проверка 2FA
        if (user.is2FAEnabled) {
            if (!twoFACode) {
                return res.status(400).json({ error: '2FA code is required' });
            }

            const is2FACodeValid = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: twoFACode,
            });

            if (!is2FACodeValid) {
                return res.status(401).json({ error: 'Invalid 2FA code' });
            }
        }

        // Создание JWT токена
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Пример защищенного маршрута для админов
router.get('/admin', checkRole('admin'), (req, res) => {
    res.send('Welcome Admin!');
});

module.exports = router;
