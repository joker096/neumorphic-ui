# Tailwind CSS UI Components & Styles (Neumorphism / Glassmorphism)

Этот файл содержит полную библиотеку стилей (для Темной и Светлой темы), использованных в проекте. Все элементы можно скопировать и использовать в обычном HTML c подключенным Tailwind CSS (`<script src="https://cdn.tailwindcss.com"></script>`).

---

## 1. Основной фон приложения (App Background)
Тема задает фон и базовый цвет текста.

**Тёмная тема (Dark Theme Canvas):**
```html
<div class="bg-[#101216] text-white min-h-screen relative overflow-hidden">
  <!-- Внутренний контейнер -->
</div>
```

**Светлая тема (Light Theme Canvas):**
```html
<div class="bg-[#eaeff4] text-slate-800 min-h-screen relative overflow-hidden">
  <!-- Внутренний контейнер -->
</div>
```

---

## 2. Кнопки номеронабирателя (Dialpad Keys)
Выпуклые круглые кнопки с эффектом вдавленности при нажатии (`active:shadow-inset...`).

**Тёмная тема:**
```html
<div class="w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.05] active:scale-[0.92] select-none group bg-[#13151b] shadow-[0_8px_16px_rgba(0,0,0,0.4),_inset_0_1.5px_2px_rgba(255,255,255,0.08),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border border-white/[0.04] active:shadow-[inset_0_10px_20px_rgba(0,0,0,0.9),_inset_0_2px_4px_rgba(0,0,0,0.9)]">
    <span class="text-[26px] font-semibold leading-none transition-colors duration-200 text-gray-200 group-hover:text-white">5</span>
    <span class="text-[9px] mt-[3px] font-bold tracking-widest transition-colors duration-200 text-orange-500/70 group-hover:text-orange-400">JKL</span>
</div>
```

**Светлая тема:**
```html
<div class="w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.05] active:scale-[0.92] select-none group bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.9),_8px_8px_16px_rgba(165,175,190,0.5),_inset_2px_2px_4px_rgba(255,255,255,1)] border border-white/80 active:shadow-[inset_4px_4px_12px_rgba(165,175,190,0.5),_inset_-3px_-3px_8px_rgba(255,255,255,0.9)]">
    <span class="text-[26px] font-semibold leading-none transition-colors duration-200 text-slate-700 group-hover:text-slate-900 group-active:scale-95">5</span>
    <span class="text-[9px] mt-[3px] font-bold tracking-widest transition-colors duration-200 text-orange-600/70 group-hover:text-orange-700 group-active:scale-95">JKL</span>
</div>
```

---

## 3. Главная кнопка действия (Primary Action / Call Button)
Яркая кнопка с градиентом.

**Тёмная тема (Градиент с оранжевым свечением):**
```html
<div class="w-[76px] h-[76px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.08] active:scale-95 hover:rotate-3 shadow-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_12px_24px_rgba(249,115,22,0.3),_inset_0_2px_4px_rgba(255,255,255,0.3)] active:shadow-[inset_0_8px_16px_rgba(0,0,0,0.4)]">
    <!-- SVG Icon -->
</div>
```

**Светлая тема (Градиент зеленого/мятного цвета):**
```html
<div class="w-[76px] h-[76px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.08] active:scale-95 hover:rotate-3 shadow-xl bg-gradient-to-br from-teal-400 to-teal-500 shadow-[0_12px_24px_rgba(20,184,166,0.3),_inset_0_2px_4px_rgba(255,255,255,0.5)] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)]">
    <!-- SVG Icon -->
</div>
```

---

## 4. Элемент списка чатов (List Item / Chat Item)
Используется для списков.

**Тёмная тема:**
```html
<!-- Обычное состояние -->
<div class="w-[400px] p-3 flex items-center gap-4 cursor-pointer transition-all duration-300 rounded-3xl bg-[#13151b] shadow-[0_8px_16px_rgba(0,0,0,0.3),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.6)] border border-white/[0.02] hover:scale-[1.02]">
  <!-- Avatar -->
  <div class="w-[52px] h-[52px] rounded-[18px] bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold text-xl shadow-sm">A</div>
  <!-- Text Content -->
</div>

<!-- Активное (нажатое/выбранное) состояние (Вдавленное) -->
<div class="w-[400px] p-3 flex items-center gap-4 rounded-3xl bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border border-orange-500/20">
</div>
```

**Светлая тема:**
```html
<!-- Обычное состояние -->
<div class="w-[400px] p-3 flex items-center gap-4 cursor-pointer transition-all duration-300 rounded-3xl bg-[#eaeff4] shadow-[-6px_-6px_12px_rgba(255,255,255,0.8),_8px_8px_16px_rgba(165,175,190,0.4),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-white/80 hover:scale-[1.02]">
  <!-- Avatar -->
  <div class="w-[52px] h-[52px] rounded-[18px] bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold text-xl shadow-sm">A</div>
  <!-- Text Content -->
</div>

<!-- Активное (нажатое/выбранное) состояние (Вдавленное) -->
<div class="w-[400px] p-3 flex items-center gap-4 rounded-3xl bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border border-black/5">
</div>
```

---

## 5. Переключатель (Toggle Switch)
Настройки формата Вкл/Выкл.

**Тёмная тема:**
```html
<!-- Контейнер -->
<div class="flex flex-col mb-4 cursor-pointer group px-2 pb-2 border-b border-white-[0.02]">
  <!-- Верхняя строка: Текст и сам Toggle -->
  <div class="flex items-center justify-between mb-2">
    <span class="text-[13.5px] font-semibold text-[#e8ecf2]">Push Notifications</span>
    
    <!-- Переключатель (ВКЛ) -->
    <div class="relative w-11 h-6 rounded-full transition-colors duration-300 bg-orange-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
      <div class="absolute top-[2px] left-[2px] bg-white w-[20px] h-[20px] rounded-full shadow-md transition-transform duration-300 transform translate-x-5"></div>
    </div>
    
    <!-- Переключатель (ВЫКЛ) -->
    <div class="relative w-11 h-6 rounded-full transition-colors duration-300 bg-[#0d0e12] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border border-white/5">
      <div class="absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full shadow-sm transition-transform duration-300 bg-[#2b303b] translate-x-0"></div>
    </div>
  </div>
</div>
```

**Светлая тема:**
```html
<!-- Переключатель (ВКЛ) -->
<div class="relative w-11 h-6 rounded-full transition-colors duration-300 bg-teal-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
  <div class="absolute top-[2px] left-[2px] bg-white w-[20px] h-[20px] rounded-full shadow-md transition-transform duration-300 transform translate-x-5"></div>
</div>

<!-- Переключатель (ВЫКЛ) -->
<div class="relative w-11 h-6 rounded-full transition-colors duration-300 bg-[#d1d9e2] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-white/50">
  <div class="absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full shadow-sm transition-transform duration-300 bg-white translate-x-0"></div>
</div>
```

---

## 6. Карточка / Панель с контентом (Pill Menu / Widget Card)
Стеклянная матовая панель (Glassmorphism).

**Тёмная тема:**
```html
<div class="p-5 rounded-[40px] w-full shadow-2xl bg-[#1a1d24]/60 backdrop-blur-xl border border-white/5 shadow-[0_24px_48px_rgba(0,0,0,0.4),_inset_0_1px_2px_rgba(255,255,255,0.05)]">
  <!-- Контент -->
</div>
```

**Светлая тема:**
```html
<div class="p-5 rounded-[40px] w-full shadow-2xl bg-[#eaeff4]/60 backdrop-blur-xl border border-white/60 shadow-[-10px_-10px_20px_rgba(255,255,255,0.6),_16px_24px_40px_rgba(165,175,190,0.3)]">
  <!-- Контент -->
</div>
```

---

## 7. Кнопка настроек "Овальная" (PillButton)
Используется внутри виджета "Menu Blocks". Имеет интерактивный `group-hover` и зависимость от `active`.

**Тёмная тема (Обычная):**
```html
<div class="relative flex items-center shrink-0 cursor-pointer group transition-transform hover:scale-[1.02] active:scale-95 w-[110px] h-[48px] justify-between px-2.5">
  <div class="absolute inset-0 rounded-full flex items-center justify-center font-bold tracking-wide transition-all z-10 bg-[#15171d] hover:bg-[#1a1d24] shadow-[0_4px_10px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.03),_inset_0_-1px_2px_rgba(0,0,0,0.5)] border border-white/[0.02]"></div>
  <div class="relative z-20 flex flex-col justify-center w-full items-start pl-0.5">
     <span class="text-[12px] font-bold leading-[14px] transition-colors text-gray-400 group-hover:text-white">Label</span>
     <span class="text-[8.5px] font-semibold opacity-60 leading-tight transition-colors text-gray-500">Subtitle</span>
  </div>
  <!-- Иконка / Toggle справа, z-20 -->
</div>
```

**Тёмная тема (Активная):**
```html
<div class="relative flex items-center shrink-0 cursor-pointer group transition-transform hover:scale-[1.02] active:scale-95 w-[110px] h-[48px] justify-between px-2.5">
  <!-- Вдавленный эффект активной кнопки -->
  <div class="absolute inset-0 rounded-full flex items-center justify-center font-bold tracking-wide transition-all z-10 bg-[#1a1d24] shadow-[0_6px_16px_rgba(0,0,0,0.8),_inset_0_1px_2px_rgba(255,255,255,0.06),_inset_0_-2px_4px_rgba(0,0,0,0.9)] border border-white/[0.04]"></div>
  <div class="relative z-20 flex flex-col justify-center w-full items-start pl-0.5">
     <!-- Яркий белый цвет и тень шрифта -->
     <span class="text-[12px] font-bold leading-[14px] transition-colors text-white drop-shadow-sm">Label</span>
     <span class="text-[8.5px] font-semibold opacity-60 leading-tight transition-colors text-gray-300">Subtitle</span>
  </div>
</div>
```

**Светлая тема (Свечение и тени адаптированы через bg-[#eef2f6] и bg-[#f4f7f9]):**
Подробности тени можно взять напрямую из компонента `PillButton`.

---

## 8. Иконочные кнопки с круглым фоном (Action Circle Button)
Такие как "Add Contact", "Archive".

**Тёмная тема (С выступающим неоморфным кругом):**
```html
<div class="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-[1.05] active:scale-95 bg-[#13151b] shadow-[0_8px_16px_rgba(0,0,0,0.4),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.8)] border border-white/[0.04]">
  <svg class="text-white" width="22" height="22" stroke="currentColor" fill="none"></svg>
</div>
```

**Светлая тема:**
```html
<div class="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-[1.05] active:scale-95 bg-[#e2e8f0] shadow-[inset_4px_4px_8px_rgba(165,175,190,0.3),_inset_-2px_-2px_4px_rgba(255,255,255,1),_8px_8px_16px_rgba(165,175,190,0.4),_-4px_-4px_12px_rgba(255,255,255,0.8)] border border-white">
  <svg class="text-slate-600" width="22" height="22" stroke="currentColor" fill="none"></svg>
</div>
```

---

## 9. Поисковик (SearchBar)
Вдавленное поле для ввода.

**Тёмная тема:**
```html
<div class="flex items-center w-[300px] h-[48px] rounded-full px-5 transition-all duration-300 focus-within:shadow-[0_0_15px_rgba(255,255,255,0.1)] bg-[#0d0e12] border border-white/5 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)]">
    <svg class="text-gray-500 mr-3" width="18" height="18"></svg>
    <input type="text" placeholder="Search..." class="bg-transparent w-full text-white placeholder-gray-600 focus:outline-none text-[15px] font-medium" />
</div>
```

**Светлая тема:**
```html
<div class="flex items-center w-[300px] h-[48px] rounded-full px-5 transition-all duration-300 focus-within:shadow-[0_0_15px_rgba(255,255,255,0.5)] bg-[#eaeff4] shadow-[inset_3px_3px_6px_rgba(165,175,190,0.5),_inset_-2px_-2px_4px_rgba(255,255,255,1)] border border-white/50">
    <svg class="text-slate-400 mr-3" width="18" height="18"></svg>
    <input type="text" placeholder="Search..." class="bg-transparent w-full text-slate-700 placeholder-slate-400 focus:outline-none text-[15px] font-medium" />
</div>
```

---

## 10. Маленькая кнопка внутри плеера (Hub Icon Toggle - Вдавленная)
Используется как переключатель активного состояния (Например "Не беспокоить").

**Тёмная тема (Обычное состояние):**
```html
<div class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-white/5 border border-transparent shadow-[0_4px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_12px_rgba(0,0,0,0.5)] bg-[#13151b]">
   <svg class="text-gray-500" width="18" height="18"></svg>
</div>
```

**Тёмная тема (Активное состояние):**
```html
<div class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 bg-[#1a1d24] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8),_inset_0_-1px_2px_rgba(255,255,255,0.05)] border border-white/5">
     <!-- Свечение цвета: text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.8)] -->
   <svg class="text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.8)]" width="18" height="18" stroke-width="2"></svg>
</div>
```

**Светлая тема (Обычное состояние):**
```html
<div class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 hover:bg-white border border-transparent shadow-[0_2px_6px_rgba(165,175,190,0.3)] hover:shadow-[0_4px_8px_rgba(165,175,190,0.4)] bg-[#f4f7f9]">
   <svg class="text-slate-400" width="18" height="18"></svg>
</div>
```

**Светлая тема (Активное состояние):**
```html
<div class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 bg-[#eaeff4] shadow-[inset_3px_3px_6px_rgba(165,175,190,0.5),_inset_-2px_-2px_4px_rgba(255,255,255,1)] border border-black/5">
    <!-- Свечение цвета: text-orange-600 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] -->
   <svg class="text-orange-600 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" width="18" height="18" stroke-width="2"></svg>
</div>
```

---

## 11. Скроллбары (Custom Scrollbars)
Используйте кастомные классы скролла в `index.css`:

**CSS (`index.css`):**
```css
/* Custom Scrollbars */
.scrollbar-dark::-webkit-scrollbar { width: 6px; }
.scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
.scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
.scrollbar-dark::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }

.scrollbar-light::-webkit-scrollbar { width: 6px; }
.scrollbar-light::-webkit-scrollbar-track { background: transparent; }
.scrollbar-light::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 10px; }
.scrollbar-light::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.25); }
```

**Применение:**
```html
<div class="scrollbar-dark bg-[#13151b] overflow-y-auto w-[200px] h-[300px]">
  <!-- длинный контент -->
</div>
```

---

## Использование 

Эти классы можно комбинировать и встраивать в любые UI-фреймворки или использовать на классических HTML/JS сайтах. Tailwind автоматически обработает параметры `shadow-[inset_...]`, `bg-[#13151b]`, а также псевдоклассы `:hover`, `:active`, `group` и `focus-within`.
