# PixelAnim8 - Netlify Version

## 🎮 8-bit GIF Generator

Полностью функциональная версия для Netlify с 16+ эффектами генерации.

---

## 📦 Структура

```
netlify-app/
├── netlify/
│   └── functions/
│       └── generate.js    # Serverless функция с эффектами
├── public/
│   └── index.html         # Мобильный фронтенд
├── netlify.toml           # Конфигурация Netlify
└── package.json           # Зависимости
```

---

## 🚀 Развертывание на Netlify

### Способ 1: Через GitHub
1. Создайте репозиторий на GitHub
2. Загрузите содержимое папки `netlify-app`
3. Подключите репозиторий к Netlify
4. Netlify автоматически установит зависимости и развернет

### Способ 2: Drag & Drop
1. Откройте https://app.netlify.com/drop
2. Перетащите папку `netlify-app`
3. Готово!

### Способ 3: Netlify CLI
```bash
cd netlify-app
npm install
npx netlify deploy --prod
```

---

## ✨ 16 Эффектов

| Эффект | Описание | Ключевые слова |
|--------|----------|----------------|
| **Breathing** | Пульсирующее масштабирование | breathing, pulse |
| **Pixel Reveal** | Постепенное появление пикселей | reveal, draw |
| **Color Wave** | Волна цвета | wave, sweep |
| **Ripple** | Эффект воды | ripple, water |
| **Glitch** | Цифровые помехи | glitch, corrupt |
| **Vortex** | Спиральное искажение | vortex, spiral |
| **Rainbow** | Цикл цветов радуги | rainbow, hue |
| **Noise Warp** | Шумовое искажение | warp, distort |
| **Pixel Dissolve** | Растворение пикселей | dissolve, fade |
| **Mosaic Zoom** | Мозаичное увеличение | mosaic, pixelate |
| **Pixel Sort** | Сортировка по яркости | sort, organize |
| **RGB Split** | Разделение каналов | rgb, split |
| **CRT Scanlines** | Эффект старого телевизора | crt, tv |
| **Interlace** | Черезстрочная развёртка | interlace |
| **Pixelate** | Прогрессивная пикселизация | pixelate, block |
| **Edge Flow** | Анимация по границам | edge, outline |

---

## 📱 Мобильная оптимизация

### Решённые проблемы:
- ✅ Нет "прыжущего" экрана на Android
- ✅ Нет проблем с viewport на iPhone
- ✅ Safe area для iPhone X+
- ✅ Touch-friendly элементы управления
- ✅ Отключён zoom при двойном тапе
- ✅ Плавный скролл

### CSS решения:
```css
/* Фикс для iOS Safari */
html {
  height: 100%;
  overflow: hidden;
}
body {
  position: fixed;
  width: 100%;
}

/* Safe areas */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);

/* Отключение zoom */
-webkit-text-size-adjust: 100%;
-webkit-tap-highlight-color: transparent;
```

---

## 🧮 Математические функции

### Perlin Noise
```javascript
function noise2D(x, y, seed) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}
```

### Fractal Brownian Motion
```javascript
function fbm(x, y, octaves, seed) {
  let value = 0, amplitude = 0.5, frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency, seed);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}
```

### Easing Functions
- Linear, Quad, Cubic
- Elastic (резиновый)
- Bounce (прыжок)

---

## ⚙️ Параметры

| Параметр | Значения | По умолчанию |
|----------|----------|--------------|
| Palette | NES, Game Boy, C64, Mono, Sepia, VGA | NES |
| Frames | 2-12 | 4 |
| Speed | 2-15 FPS | 5 FPS |
| Size | 128px, 256px, 512px | 256px |

---

## 🎨 Палитры

### NES (8 цветов)
```
#0f0f0f #1d2b53 #7e2553 #008751
#ab5236 #5f574f #c2c3c7 #fff1e8
```

### Game Boy (4 оттенка зелёного)
```
#0f380f #306230 #8bac0f #9bbc0f
```

### Commodore 64 (8 цветов)
```
#000000 #ffffff #880000 #aaffee
#cc44cc #00cc55 #0000aa #eeee77
```

---

## 🔧 Зависимости

```json
{
  "canvas": "^2.11.2",      // Рендеринг изображений
  "gif-encoder-2": "^1.0.5" // Создание GIF
}
```

---

## 📊 Эффекты и математика

### Edge Flow (Анимация границ)
1. Находит границы между цветами (colorDistance > 30)
2. Определяет направление границы (top, bottom, left, right)
3. Анимирует "поток" по границам

### Pixel Sort (Сортировка пикселей)
1. Вычисляет яркость каждого пикселя
2. Сортирует пиксели в строках по яркости
3. Постепенно применяет сортировку

### Color Wave (Цветовая волна)
1. Вычисляет расстояние от волны
2. Применяет гауссиан для интенсивности
3. Увеличивает яркость в зоне волны

---

## 🌐 API

### POST `/.netlify/functions/generate`

**Request:**
```json
{
  "image": "data:image/png;base64,...",
  "prompt": "ripple effect",
  "params": {
    "palette": "nes",
    "frames": 4,
    "delay": 5,
    "size": "256"
  }
}
```

**Response:**
```json
{
  "success": true,
  "gifData": "data:image/gif;base64,...",
  "metadata": {
    "frameCount": 4,
    "palette": "NES",
    "fileSize": 12345,
    "dimensions": { "width": 256, "height": 256 },
    "effect": "ripple"
  }
}
```

---

## 📝 Лицензия

MIT License - используйте свободно!
