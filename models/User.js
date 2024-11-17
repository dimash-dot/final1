const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
    is2FAEnabled: { type: Boolean, default: false },  // Флаг для включения 2FA
    twoFactorSecret: { type: String, default: null }, // Секретный ключ для 2FA
    failedLoginAttempts: { type: Number, default: 0 }, // Количество неудачных попыток входа
    lastLoginAttempt: { type: Date, default: null },  // Время последней неудачной попытки входа
    lockUntil: { type: Date, default: null }  // Время до снятия блокировки
});

// Хеширование пароля перед сохранением
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);  // Хешируем пароль перед сохранением
    }
    next();
});

// Сравнение пароля при входе
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);  // Сравниваем хешированный пароль с введённым
};

// Генерация 2FA секретного кода
userSchema.methods.generate2FACode = function (speakeasy) {
    return speakeasy.totp({
        secret: this.twoFactorSecret,
        encoding: 'base32',
    });
};

// Сброс неудачных попыток входа
userSchema.methods.resetFailedLoginAttempts = function () {
    this.failedLoginAttempts = 0;
    this.lastLoginAttempt = null;
    this.lockUntil = null;  // Снимаем блокировку
};

// Увеличение счётчика неудачных попыток входа
userSchema.methods.incrementFailedLoginAttempts = function () {
    this.failedLoginAttempts += 1;
    this.lastLoginAttempt = new Date();

    // Если попытки превышают 3, блокируем пользователя на 30 минут
    if (this.failedLoginAttempts >= 3) {
        this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 минут
    }
};

// Проверка, необходимо ли заблокировать пользователя из-за слишком большого количества неудачных попыток
userSchema.methods.isLockedOut = function () {
    // Если время блокировки ещё не прошло, то пользователь заблокирован
    return this.lockUntil && this.lockUntil > Date.now();
};

// Проверка, если заблокирован ли пользователь и можно ли ему снова войти
userSchema.methods.isLockExpired = function () {
    return this.lockUntil && this.lockUntil <= Date.now(); // Проверка на истечение блокировки
};

module.exports = mongoose.model('User', userSchema);
