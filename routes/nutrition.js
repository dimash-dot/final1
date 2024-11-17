const express = require('express');
const axios = require('axios');

const router = express.Router();
const NUTRITIONIX_API_URL = 'https://trackapi.nutritionix.com/v2/natural/nutrients';

// Функция для получения данных о фрукте
const getFruitData = async (fruit) => {
    try {
        const response = await axios.post(
            NUTRITIONIX_API_URL,
            { query: fruit },
            {
                headers: {
                    'x-app-id': process.env.NUTRITIONIX_APP_ID,  // Используем App ID
                    'x-app-key': process.env.NUTRITIONIX_API_KEY, // Используем API ключ
                },
            }
        );

        // Возвращаем необходимые данные
        return {
            name: fruit,
            calories: response.data.foods[0].nf_calories || 'N/A',
            fat: response.data.foods[0].nf_total_fat || 'N/A',
            sugars: response.data.foods[0].nf_sugars || 'N/A',
            protein: response.data.foods[0].nf_protein || 'N/A',
        };
    } catch (error) {
        console.error('Error fetching nutrition data:', error.message);
        throw new Error('Failed to fetch data from Nutritionix');
    }
};

// Маршрут для получения данных о фрукте
router.post('/fruit', async (req, res) => {
    const { fruit, characteristics } = req.body; // Получаем выбранный фрукт и характеристики

    if (!fruit || !characteristics || characteristics.length < 1) {
        return res.status(400).json({ error: 'Fruit and at least one characteristic are required' });
    }

    try {
        const fruitData = await getFruitData(fruit);
        const selectedData = {};

        // Проверяем, является ли characteristics массивом или строкой и приводим к массиву
        const characteristicsArray = Array.isArray(characteristics) ? characteristics : [characteristics];

        // Отбираем только выбранные характеристики
        characteristicsArray.forEach((characteristic) => {
            if (fruitData.hasOwnProperty(characteristic)) {
                selectedData[characteristic] = fruitData[characteristic];
            }
        });

        res.status(200).json({ name: fruit, ...selectedData }); // Отправляем данные для фронтенда
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fruit data', details: error.message });
    }
});

// Отображение страницы визуализации
router.get('/visualize', (req, res) => {
    res.render('nutrition-visualize', { data: null }); // Передаем пустые данные для начала
});

module.exports = router;
