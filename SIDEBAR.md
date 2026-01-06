ДЕТАЛЬНАЯ ИНСТРУКЦИЯ ДЛЯ AI-АГЕНТА

1. АРХИТЕКТУРА И СТРУКТУРА
   Основной контейнер:
   DIV (сайдбар-контейнер)
   ├─ width: ~355-400px (фиксированная или адаптивная)
   ├─ display: flex
   ├─ flex-direction: column
   ├─ height: 100vh (на весь экран)
   ├─ position: fixed или absolute (справа на странице)
   ├─ overflow: hidden (основной контейнер НЕ скролл!)
   │
   ├─ HEADER (неподвижный)
   │ ├─ Кнопки: "Activity", "16 Sources", "Close"
   │ ├─ display: flex
   │ ├─ flex-shrink: 0 (важно! не сжимается)
   │ └─ border-bottom (разделитель)
   │
   └─ CONTENT AREA (скролл-контейнер #1)
   ├─ flex: 1 (растёт, занимает свободное место)
   ├─ overflow-y: auto (НАТИВНЫЙ СКРОЛЛ!)
   ├─ display: flex
   ├─ flex-direction: column
   └─ Содержит две независимые секции
   ├─ SECTION 1: Citations (скролл #1 в цитатах)
   │ ├─ min-height: fit-content
   │ ├─ overflow-y: auto (ВТОРОЙ НАТИВНЫЙ СКРОЛЛ)
   │ └─ Список ссылок/цитат
   │
   └─ SECTION 2: Sources (или другой контент)
   ├─ min-height: fit-content
   ├─ overflow-y: auto (ТРЕТИЙ НАТИВНЫЙ СКРОЛЛ)
   └─ Список источников

2. КЛЮЧЕВЫЕ CSS КЛАССЫ И СВОЙСТВА
   Главный сайдбар-контейнер:
   css.sidebar-main {
   display: flex;
   flex-direction: column;
   height: 100vh;
   width: 355px;
   position: fixed;
   right: 0;
   top: 0;
   overflow: hidden; /_ !! ВАЖНО _/
   background-color: var(--bg-primary);
   border-left: 1px solid var(--border-color);
   z-index: 1000;
   }

Заголовок (шапка, не скролл):
css.sidebar-header {
display: flex;
flex-shrink: 0; /_ !! ВАЖНО - не сжимается _/
gap: 8px;
padding: 12px 16px;
border-bottom: 1px solid var(--border-color);
align-items: center;
justify-content: space-between;
}

Основной контент-контейнер:
css.sidebar-content {
flex: 1; /_ займёт все оставшееся пространство _/
min-height: 0; /_ !! ВАЖНО для flex _/
display: flex;
flex-direction: column;
overflow: hidden; /_ скролл берёт на себя внутри _/
}

Первый скролл-контейнер (Citations):
css.scroll-container-1 {
flex: 1;
min-height: 0;
overflow-y: auto;
overflow-x: hidden;

/_ Нативный scrollbar-gutter для стабильности _/
scrollbar-gutter: stable;

/_ Опционально - настройка скроллбара _/
&::-webkit-scrollbar {
width: 8px;
}
&::-webkit-scrollbar-track {
background: transparent;
}
&::-webkit-scrollbar-thumb {
background: var(--scrollbar-color);
border-radius: 4px;
}
}

Второй скролл-контейнер (Sources):
css.scroll-container-2 {
flex: 0 1 auto; /_ может расти, но не обязательно _/
min-height: 0;
overflow-y: auto;
overflow-x: hidden;
scrollbar-gutter: stable;
border-top: 1px solid var(--border-color);

max-height: 40vh; /_ опционально - ограничивает высоту _/
}

3. HTML СТРУКТУРА (ПРИМЕР)
   html<div class="sidebar-main">
     <!-- HEADER -->
     <div class="sidebar-header">
       <button class="btn-tab active">Activity</button>
       <button class="btn-tab">16 Sources</button>
       <button class="btn-close" aria-label="Close">✕</button>
     </div>

  <!-- MAIN CONTENT AREA -->
  <div class="sidebar-content">
    
    <!-- SCROLL CONTAINER 1: Citations -->
    <div class="scroll-container-1">
      <div class="section citations">
        <h3 class="section-title">Citations</h3>
        <ul class="citations-list">
          <li class="citation-item">
            <a href="...">Source Title</a>
            <p>Description...</p>
          </li>
          <!-- repeat items -->
        </ul>
      </div>
    </div>
    
    <!-- SCROLL CONTAINER 2: Sources -->
    <div class="scroll-container-2">
      <div class="section sources">
        <h3 class="section-title">All Sources</h3>
        <ul class="sources-list">
          <li class="source-item">...</li>
          <!-- repeat items -->
        </ul>
      </div>
    </div>
    
  </div>
</div>

4. КРИТИЧЕСКИ ВАЖНЫЕ МОМЕНТЫ
   ✅ ДА (что именно нужно скопировать):

overflow: hidden на главном контейнере
flex: 1; min-height: 0; для скролл-контейнеров (это позволяет flex корректно считать высоту)
flex-shrink: 0 на header (чтобы он не сжимался)
overflow-y: auto; overflow-x: hidden на каждом скролл-контейнере
scrollbar-gutter: stable для стабильного layout'а при появлении/исчезновении скроллбара
::-webkit-scrollbar стили для нативного скроллбара (если нужна кастомизация)

❌ НЕТ (что НЕ использовать):

Не использовать max-height на главном контейнере (иначе может скролл родителя затащить весь сайдбар)
Не использовать custom scroll библиотеки (momentum scroll, SimpleBar и т.д.)
Не скрывать нативный скроллбар полностью (сохранить натив или скрыть только визуально через CSS)

5. КЛЮЧЕВОЕ ПОВЕДЕНИЕ: "PULL-TO-REFRESH"
   В вашем случае важно, что при скролле в крайних позициях контейнер "оттягивает" страницу:
   css.scroll-container-1, .scroll-container-2 {
   overscroll-behavior: auto; /_ дефолт - разрешить скроллу "вылезать" _/
   }

6. ТЕХСПЕКИ ДЛЯ ВАШЕГО ПРОЕКТА
   Что передать разработчику:

Создать правый сайдбар с двумя независимыми нативными скролл-контейнерами, которые:

✅ Имеют отдельные нативные скроллбары (HTML5 overflow:auto)
✅ Сохраняют дефолтное браузерное поведение (pull-to-refresh, momentum scroll)
✅ Имеют фиксированный header, который не скролл-зависимый
✅ Используют flexbox для адаптивной высоты
✅ Заняты 355-400px ширины
✅ Позиционированы fixed/absolute справа
✅ Имеют scrollbar-gutter: stable для стабильного layout'а
