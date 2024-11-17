const jwt = require('jsonwebtoken');

module.exports = function (allowedRoles) {
    return function (req, res, next) {
        // Проверяем наличие токена в заголовке авторизации
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            console.error('Access denied: No token provided.');
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        try {
            // Проверяем JWT токен и получаем данные пользователя
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Если токен валиден, добавляем данные пользователя в запрос
            req.user = decoded;

            // Проверка наличия поля роли у пользователя
            if (!req.user.role) {
                console.error('User role not found in token:', req.user);
                return res.status(400).json({ error: 'User role not found in token.' });
            }

            // Логируем роль пользователя для отладки
            console.log('User role:', req.user.role);  // Логируем роль пользователя

            // Проверяем, является ли роль пользователя одной из разрешенных
            if (!allowedRoles.includes(req.user.role)) {
                console.error('Access denied: Role mismatch. Allowed roles:', allowedRoles, 'Found:', req.user.role);
                return res.status(403).json({ error: 'Access denied. Insufficient role.' });
            }

            // Если роль подходит, продолжаем выполнение маршрута
            next();
        } catch (error) {
            console.error('Invalid token or token expired:', error.message);
            return res.status(400).json({ error: 'Invalid token or token expired.' });
        }
    };
};
