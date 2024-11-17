const express = require('express');
const yahooFinance = require('yahoo-finance2').default;

const router = express.Router();

// Функция для получения интервала на основе периода
const getIntervalForPeriod = (period) => {
    switch (period) {
        case '1d': // 1 день
            return '1d';
        case '1wk': // 1 неделя
            return '1d'; // Интервал будет 1 день, но данные за неделю
        case '1mo': // 1 месяц
            return '1d'; // Интервал 1 день, данные за месяц
        case '6mo': // 6 месяцев
            return '1d'; // Интервал 1 день, данные за полгода
        case '1y': // 1 год
            return '1d'; // Интервал 1 день, данные за год
        case 'max': // Всё время
            return '1mo'; // Данные за все время
        default:
            return '1d'; // По умолчанию 1 день
    }
};

// Маршрут для получения данных о котировках акций (GET /stock/:symbol)
router.get('/stock/:symbol', async (req, res) => {
    const { symbol } = req.params;
    const { period } = req.query; // Получаем период из параметров запроса

    try {
        const interval = getIntervalForPeriod(period); // Получаем интервал для выбранного периода

        // Получаем исторические данные для выбранного периода
        const quotes = await yahooFinance.historical(symbol, {
            period1: '2023-01-01', // Начальная дата (можно обновить для динамической даты)
            period2: '2023-12-31', // Конечная дата (можно обновить для динамической даты)
            interval: interval, // Интервал
        });

        if (quotes.length === 0) {
            return res.status(400).json({ error: 'No data available for this symbol.' });
        }

        // Преобразуем данные в нужный формат
        const formattedData = quotes.map(entry => ({
            timestamp: entry.date,
            open: entry.open,
            high: entry.high,
            low: entry.low,
            close: entry.close,
        }));

        res.status(200).json({ symbol, data: formattedData });
    } catch (error) {
        console.error('Error fetching data from Yahoo Finance:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from Yahoo Finance.' });
    }
});

// Маршрут для визуализации данных
router.get('/visualize', (req, res) => {
    res.render('finance-visualize', { data: null }); // Передаем пустые данные для начала
});

module.exports = router;
