// models/Portfolio.js
const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        images: {
            type: [String], // Массив строк для хранения путей к изображениям
            validate: {
                validator: function (v) {
                    return v.length === 3; // Ожидаем, что будет ровно 3 изображения
                },
                message: 'Each portfolio item must have exactly 3 images.',
            },
            required: true,
        },
        deletedAt: {
            type: Date, // Поле для хранения времени удаления
            required: false,
        },
    },
    { timestamps: true } // Автоматически добавляет createdAt и updatedAt
);

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;
