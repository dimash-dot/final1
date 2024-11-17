// emailService.js
const nodemailer = require('nodemailer');

// Создание транспортного объекта для отправки email
const transporter = nodemailer.createTransport({
    service: 'gmail', // Можно изменить на другой сервис
    auth: {
        user: process.env.EMAIL_USER, // Логин для почты (например, ваш Gmail)
        pass: process.env.EMAIL_PASS, // Пароль или App Password
    },
});

// Функция отправки email
const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER, // Отправитель
        to, // Получатель
        subject, // Тема
        text, // Текст письма
    };

    return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
