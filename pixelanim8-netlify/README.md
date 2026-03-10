# PixelAnim8 - 8-bit GIF Generator

## Что это

Генератор 8-битных GIF анимаций, работающий полностью в браузере. Без сервера, без бэкенда.

## Структура проекта

```
pixelanim8-netlify/
├── index.html      # Главная страница
├── style.css       # Стили (ретро 8-bit)
├── app.js          # Логика генерации GIF
├── netlify.toml    # Конфигурация Netlify
└── README.md       # Этот файл
```

## Как работает

1. **Загрузка** → Картинка попадает в Canvas
2. **Квантование** → RGB цвета заменяются на 8-битную палитру
3. **Анимация** → Применяется математический эффект
4. **GIF** → gif.js собирает кадры в анимацию

**Всё в браузере!** Никакого сервера.

## Как запустить локально

```bash
# Вариант 1: Python
python3 -m http.server 8080
# Открой http://localhost:8080

# Вариант 2: Node.js
npx serve .
# Открой http://localhost:3000

# Вариант 3: Просто открой index.html в браузере
```

## Как задеплоить на Netlify

### Вариант 1: Drag & Drop (самый простой)

1. Зайди на https://app.netlify.com
2. Перетащи папку `pixelanim8-netlify` в зону деплоя
3. Готово! Получишь URL вида `https://random-name.netlify.app`

### Вариант 2: Через Git

```bash
# 1. Создай репозиторий на GitHub
# 2. Инициализируй git
cd pixelanim8-netlify
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pixelanim8.git
git push -u origin main

# 3. Подключи к Netlify
# Зайди на app.netlify.com → Add New Site → Import Git Repository
# Выбери репозиторий → Deploy
```

### Вариант 3: Через Netlify CLI

```bash
# Установи CLI
npm install -g netlify-cli

# Авторизуйся
netlify login

# Задеплой
cd pixelanim8-netlify
netlify deploy --prod
```

## Эффекты (10 штук)

| Эффект | Ключевые слова | Описание |
|--------|----------------|----------|
| **Pulse** | pulse, breathing | Масштабирование вверх-вниз |
| **Rainbow** | rainbow, hue | Циклический сдвиг цвета |
| **Wave** | wave | Волновое искажение |
| **Shake** | shake, vibrat | Случайное дрожание |
| **Spin** | spin, rotate | Вращение на 360° |
| **Zoom** | zoom | Приближение-отдаление |
| **Glitch** | glitch | Цифровые артефакты |
| **Reveal** | reveal, draw | Появление по пикселям |
| **Ripple** | ripple, water | Круговые волны |
| **Vortex** | vortex, spiral | Спиральное закручивание |

## Палитры (4 штуки)

| Палитра | Цветов | Описание |
|---------|--------|----------|
| **NES** | 8 | Классическая Nintendo |
| **Game Boy** | 4 | Зелёные оттенки |
| **C64** | 8 | Commodore 64 |
| **Mono** | 2 | Чёрно-белая |

## Технологии

- **Canvas API** — обработка изображений
- **gif.js** — генерация GIF (Web Workers)
- **Чистый JS** — без фреймворков
- **CSS** — ретро-стилизация

## Поддержка браузеров

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Ограничения

- Макс. размер изображения: 256×256 (для стабильной работы)
- Макс. размер файла: 5MB
- Web Workers обязательны для gif.js

## Кастомизация

### Добавить эффект

```javascript
// В app.js, объект Effects
Effects.myEffect = (baseData, width, height, frameCount) => {
  const frames = [];
  for (let f = 0; f < frameCount; f++) {
    // Твоя логика
    const frame = new Uint8ClampedArray(baseData);
    // ... модификация пикселей
    frames.push(new ImageData(frame, width, height));
  }
  return frames;
};

// Добавь в parseEffect()
if (p.includes('mykeyword')) return 'myEffect';
```

### Добавить палитру

```javascript
// В PALETTES
myPalette: {
  name: 'My Palette',
  colors: [[r,g,b], [r,g,b], ...],
  hex: ['#rrggbb', '#rrggbb', ...]
}
```

---

Made with ❤️ for retro gaming fans
