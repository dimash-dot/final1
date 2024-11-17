const express = require('express');
const nodemailer = require('nodemailer'); // Подключаем nodemailer
const checkRole = require('../middleware/checkRole'); // Для проверки роли
const Portfolio = require('../models/Portfolio'); // Импорт модели

const router = express.Router();

// Nodemailer настройка
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Используйте переменные окружения для безопасности
        pass: process.env.EMAIL_PASS,
    },
});

// Создание элемента портфолио (доступно только админам и редакторам)
router.post('/create', checkRole(['admin', 'editor']), async (req, res) => {
    const { title, description, images } = req.body;

    try {
        const portfolioItem = new Portfolio({
            title,
            description,
            images,
        });

        await portfolioItem.save();

        // Отправка email уведомления о создании элемента
        await transporter.sendMail({
            from: process.env.EMAIL_USER, // От кого
            to: process.env.NOTIFY_EMAIL, // Кому (например, на почту админа)
            subject: 'New Portfolio Item Created',
            text: `A new portfolio item has been created with title: ${title}.`,
        });

        res.status(201).json({ message: 'Portfolio item created successfully', portfolioItem });
    } catch (error) {
        console.error('Error creating portfolio item:', error);
        res.status(400).json({ error: error.message });
    }
});

// Редактирование элемента портфолио (доступно только админам)
router.put('/edit/:id', checkRole('admin'), async (req, res) => {
    const { title, description, images } = req.body;
    const { id } = req.params;

    try {
        const portfolioItem = await Portfolio.findByIdAndUpdate(
            id,
            { title, description, images },
            { new: true } // Возвращаем обновленный элемент
        );

        if (!portfolioItem) {
            return res.status(404).json({ error: 'Portfolio item not found' });
        }

        // Отправка email уведомления о обновлении элемента
        await transporter.sendMail({
            from: process.env.EMAIL_USER, // От кого
            to: process.env.NOTIFY_EMAIL, // Кому (например, на почту админа)
            subject: 'Portfolio Item Updated',
            text: `A portfolio item has been updated with title: ${title}.`,
        });

        res.status(200).json({ message: 'Portfolio item updated successfully', portfolioItem });
    } catch (error) {
        console.error('Error updating portfolio item:', error);
        res.status(400).json({ error: error.message });
    }
});

// Удаление элемента портфолио (доступно только админам)
router.delete('/delete/:id', checkRole('admin'), async (req, res) => {
    const { id } = req.params;

    try {
        const portfolioItem = await Portfolio.findByIdAndDelete(id);

        if (!portfolioItem) {
            return res.status(404).json({ error: 'Portfolio item not found' });
        }

        res.status(200).json({ message: 'Portfolio item deleted successfully' });
    } catch (error) {
        console.error('Error deleting portfolio item:', error);
        res.status(400).json({ error: error.message });
    }
});

// Получение всех элементов портфолио (доступно всем)
router.get('/', async (req, res) => {
    try {
        const portfolioItems = await Portfolio.find();
        res.status(200).json({ portfolioItems });
    } catch (error) {
        console.error('Error fetching portfolio items:', error);
        res.status(400).json({ error: error.message });
    }
});

// Получение одного элемента портфолио по ID (доступно всем)
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const portfolioItem = await Portfolio.findById(id);

        if (!portfolioItem) {
            return res.status(404).json({ error: 'Portfolio item not found' });
        }

        res.status(200).json({ portfolioItem });
    } catch (error) {
        console.error('Error fetching portfolio item by ID:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
