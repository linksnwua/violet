// Основной скрипт приложения Violet Day
const STORAGE_KEY = 'violet_day_app_data_v1';

const DEFAULT_TEMPLATES = [
    { id: 't1', title: 'Магний', icon: '💊', category: 'health', favorite: true },
    { id: 't2', title: 'Витамин D', icon: '☀️', category: 'health', favorite: true },
    { id: 't3', title: 'Прогулка', icon: '🚶', category: 'sport', favorite: true },
    { id: 't4', title: 'Тренировка', icon: '🏋️', category: 'sport', favorite: true },
    { id: 't5', title: 'Вода 2л', icon: '💧', category: 'health', favorite: true },
    { id: 't6', title: 'Зарплата', icon: '💰', category: 'money', favorite: true },
    { id: 't7', title: 'Сон 8ч', icon: '💤', category: 'health', favorite: false },
    { id: 't8', title: 'Встреча', icon: '🤝', category: 'life', favorite: false },
];

let state = {
    currentDate: new Date(),
    selectedDateStr: formatDateKey(new Date()),
    records: {}, // { 'YYYY-MM-DD': [ {id, title, icon, category, note} ] }
    templates: DEFAULT_TEMPLATES,
    theme: 'light',
    activeCategoryFilter: 'all'
};

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const App = {
    init() {
        this.loadData();
        this.applyTheme();
        this.updateGreeting();
        Calendar.init();
        Badges.init();
        Stats.init();
    },

    loadData() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                state.records = parsed.records || {};
                state.templates = parsed.templates || DEFAULT_TEMPLATES;
                state.theme = parsed.theme || 'light';
            } catch (e) {
                console.error('Error loading data', e);
            }
        } else {
            // Демо данные для первого запуска
            const todayKey = formatDateKey(new Date());
            state.records[todayKey] = [
                { id: 'demo1', title: 'Магний', icon: '💊', category: 'health', note: 'Утренний прием' },
                { id: 'demo2', title: 'Прогулка', icon: '🚶', category: 'sport', note: 'Вечерний парк' }
            ];
            this.saveData();
        }
    },

    saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            records: state.records,
            templates: state.templates,
            theme: state.theme
        }));
    },

    applyTheme() {
        if (state.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('dark-theme-toggle').checked = true;
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.getElementById('dark-theme-toggle').checked = false;
        }
    },

    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Добрый вечер';
        if (hour < 6) greeting = «Доброй ночи»;
        else if (hour < 12) greeting = «Доброе утро»;
        else if (hour < 18) greeting = «Добрый день»;

        document.getElementById('greeting-title').innerText = greeting;
    },

    openScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`screen-${screenId}`).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        // Найти кнопку навигации
        const navBtn = Array.from(document.querySelectorAll('.nav-item')).find(btn => btn.getAttribute('onclick')?.includes(screenId));
        if (navBtn) navBtn.classList.add('active');

        if (screenId === 'stats') Stats.render();
        if (screenId === 'badges') Badges.render();
    },

    switchTab(screenId, btnEl) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`screen-${screenId}`).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        btnEl.classList.add('active');

        if (screenId === 'stats') Stats.render();
        if (screenId === 'badges') Badges.render();
    }
};

/* --- КАЛЕНДАРЬ --- */
const Calendar = {
    init() {
        this.render();
    },

    changeMonth(direction) {
        state.currentDate.setMonth(state.currentDate.getMonth() + direction);
        this.render();
    },

    render() {
        const year = state.currentDate.getFullYear();
        const month = state.currentDate.getMonth();

        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        document.getElementById('current-month-year').innerText = `${monthNames[month]} ${year}`;

        const gridEl = document.getElementById('calendar-grid');
        gridEl.innerHTML = '';

        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Понедельник первый
        const totalDays = new Date(year, month + 1, 0).getDate();
        const prevTotalDays = new Date(year, month, 0).getDate();

        const todayStr = formatDateKey(new Date());

        // Дни прошлого месяца
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const dayNum = prevTotalDays - i;
            const cell = document.createElement('div');
            cell.className = 'day-cell other-month';
            cell.innerHTML = `<span>${dayNum}</span>`;
            gridEl.appendChild(cell);
        }

        // Дни текущего месяца
        for (let d = 1; d <= totalDays; d++) {
            const dateObj = new Date(year, month, d);
            const dateStr = formatDateKey(dateObj);
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            if (dateStr === todayStr) cell.classList.add('today');
            if (dateStr === state.selectedDateStr) cell.classList.add('selected');

            cell.onclick = () => {
                state.selectedDateStr = dateStr;
                Calendar.render();
                Calendar.renderDayDetails();
            };

            const dayNumSpan = document.createElement('span');
            dayNumSpan.innerText = d;
            cell.appendChild(dayNumSpan);

            // Иконки записей внутри дня (до 3 штук)
            const dayRecords = state.records[dateStr] || [];
            if (dayRecords.length > 0) {
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'day-dots';
                
                const maxIcons = 3;
                for (let i = 0; i < Math.min(dayRecords.length, maxIcons); i++) {
                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'mini-badge-icon';
                    iconSpan.innerText = dayRecords[i].icon;
                    dotsContainer.appendChild(iconSpan);
                }
                if (dayRecords.length > maxIcons) {
                    const moreSpan = document.createElement('span');
                    moreSpan.className = 'more-badge';
                    moreSpan.innerText = `+${dayRecords.length - maxIcons}`;
                    dotsContainer.appendChild(moreSpan);
                }
                cell.appendChild(dotsContainer);
            }

            gridEl.appendChild(cell);
        }

        this.renderDayDetails();
    },

    renderDayDetails() {
        const titleEl = document.getElementById('selected-date-title');
        const listEl = document.getElementById('day-records-list');

        const [y, m, d] = state.selectedDateStr.split('-');
        const dateObj = new Date(y, m - 1, d);
        const options = { day: 'numeric', month: 'long', weekday: 'short' };
        titleEl.innerText = dateObj.toLocaleDateString('ru-RU', options);

        const records = state.records[state.selectedDateStr] || [];
        listEl.innerHTML = '';

        if (records.length === 0) {
            listEl.innerHTML = `<div class="empty-state">Нет записей на этот день. Нажмите «+ Добавить», чтобы создать.</div>`;
            return;
        }

        records.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'record-card';
            card.innerHTML = `
                <div class="record-left">
                    <div class="record-icon-box">${rec.icon}</div>
                    <div class="record-info">
                        <h4>${rec.title}</h4>
                        ${rec.note ? `<p>${rec.note}</p>` : ''}
                    </div>
                </div>
                <button class="delete-record-btn" onclick="Calendar.deleteRecord('${rec.id}')">🗑️</button>
            `;
            listEl.appendChild(card);
        });
    },

    deleteRecord(recordId) {
        const records = state.records[state.selectedDateStr] || [];
        state.records[state.selectedDateStr] = records.filter(r => r.id !== recordId);
        if (state.records[state.selectedDateStr].length === 0) {
            delete state.records[state.selectedDateStr];
        }
        App.saveData();
        this.render();
    }
};

/* --- МОДАЛЬНЫЕ ОКНА --- */
const Modal = {
    selectedCategory: 'health',

    openRecordModal() {
        document.getElementById('record-date-input').value = state.selectedDateStr;
        document.getElementById('record-title-input').value = '';
        document.getElementById('record-note-input').value = '';
        document.getElementById('record-icon-input').value = '💊';
        this.renderQuickTemplates();
        document.getElementById('record-modal').classList.add('open');
    },

    closeRecordModal() {
        document.getElementById('record-modal').classList.remove('open');
    },

    openTemplateModal() {
        document.getElementById('tpl-title-input').value = '';
        document.getElementById('tpl-icon-input').value = '🧘';
        document.getElementById('tpl-favorite-input').checked = false;
        document.getElementById('template-modal').classList.add('open');
    },

    closeTemplateModal() {
        document.getElementById('template-modal').classList.remove('open');
    },

    closeOnBackdrop(event, modalId) {
        if (event.target.id === modalId) {
            document.getElementById(modalId).classList.remove('open');
        }
    },

    selectCategory(cat, el) {
        this.selectedCategory = cat;
        document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    },

    renderQuickTemplates() {
        const container = document.getElementById('modal-quick-templates');
        container.innerHTML = '';
        state.templates.forEach(tpl => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'quick-tpl-pill';
            pill.innerHTML = `${tpl.icon} ${tpl.title}`;
            pill.onclick = () => {
                document.getElementById('record-icon-input').value = tpl.icon;
                document.getElementById('record-title-input').value = tpl.title;
                this.selectedCategory = tpl.category;
            };
            container.appendChild(pill);
        });
    },

    saveRecord() {
        const dateStr = document.getElementById('record-date-input').value || state.selectedDateStr;
        const title = document.getElementById('record-title-input').value.trim();
        const icon = document.getElementById('record-icon-input').value.trim() || '📌';
        const note = document.getElementById('record-note-input').value.trim();

        if (!title) {
            alert('Введите название записи');
            return;
        }

        if (!state.records[dateStr]) {
            state.records[dateStr] = [];
        }

        state.records[dateStr].push({
            id: 'rec_' + Math.random().toString(36).substr(2, 9),
            title,
            icon,
            category: this.selectedCategory,
            note
        });

        App.saveData();
        this.closeRecordModal();
        Calendar.render();
    },

    saveTemplate() {
        const title = document.getElementById('tpl-title-input').value.trim();
        const icon = document.getElementById('tpl-icon-input').value.trim() || '⭐';
        const category = document.getElementById('tpl-category-input').value;
        const favorite = document.getElementById('tpl-favorite-input').checked;

        if (!title) {
            alert('Введите название шаблона');
            return;
        }

        state.templates.push({
            id: 'tpl_' + Math.random().toString(36).substr(2, 9),
            title,
            icon,
            category,
            favorite
        });

        App.saveData();
        this.closeTemplateModal();
        Badges.render();
    }
};

/* --- ЗНАЧКИ И ШАБЛОНЫ --- */
const Badges = {
    init() {},

    filterCategory(cat, el) {
        state.activeCategoryFilter = cat;
        document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        this.render();
    },

    render() {
        const favContainer = document.getElementById('favorite-templates-grid');
        const allContainer = document.getElementById('all-templates-grid');

        favContainer.innerHTML = '';
        allContainer.innerHTML = '';

        const filtered = state.templates.filter(t => {
            if (state.activeCategoryFilter === 'all') return true;
            return t.category === state.activeCategoryFilter;
        });

        const favorites = filtered.filter(t => t.favorite);
        favorites.forEach(tpl => {
            favContainer.appendChild(this.createTemplateCard(tpl));
        });

        filtered.forEach(tpl => {
            allContainer.appendChild(this.createTemplateCard(tpl));
        });
    },

    createTemplateCard(tpl) {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `
            <div class="template-left">
                <span class="template-icon">${tpl.icon}</span>
                <span class="template-name">${tpl.title}</span>
            </div>
            <button class="delete-record-btn" onclick="Badges.deleteTemplate('${tpl.id}')">🗑️</button>
        `;
        return card;
    },

    deleteTemplate(id) {
        state.templates = state.templates.filter(t => t.id !== id);
        App.saveData();
        this.render();
    }
};

/* --- СТАТИСТИКА --- */
const Stats = {
    init() {},

    render() {
        let totalRecordsCount = 0;
        const freqMap = {};

        Object.keys(state.records).forEach(dateStr => {
            state.records[dateStr].forEach(rec => {
                totalRecordsCount++;
                const key = `${rec.icon} ${rec.title}`;
                freqMap[key] = (freqMap[key] || 0) + 1;
            });
        });

        document.getElementById('stat-total-records').innerText = totalRecordsCount;
        document.getElementById('stat-streak').innerText = Object.keys(state.records).length + ' дн.';

        const listEl = document.getElementById('habits-frequency-list');
        listEl.innerHTML = '';

        const sortedFreq = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);

        if (sortedFreq.length === 0) {
            listEl.innerHTML = `<div class="empty-state">Пока нет данных для статистики</div>`;
            return;
        }

        sortedFreq.forEach(([habit, count]) => {
            const item = document.createElement('div');
            item.className = 'freq-item';
            item.innerHTML = `
                <span>${habit}</span>
                <strong>${count} отм.</strong>
            `;
            listEl.appendChild(item);
        });
    }
};

/* --- НАСТРОЙКИ --- */
const Settings = {
    toggleTheme(checkbox) {
        state.theme = checkbox.checked ? 'dark' : 'light';
        App.saveData();
        App.applyTheme();
    },

    exportData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `violet_day_backup_${formatDateKey(new Date())}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    },

    triggerImport() {
        document.getElementById('import-file-input').click();
    },

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const parsed = JSON.parse(e.target.result);
                if (parsed.records && parsed.templates) {
                    state.records = parsed.records;
                    state.templates = parsed.templates;
                    if (parsed.theme) state.theme = parsed.theme;
                    App.saveData();
                    App.applyTheme();
                    Calendar.render();
                    alert('Данные успешно импортированы!');
                } else {
                    alert('Неверный формат файла.');
                }
            } catch (err) {
                alert('Ошибка чтения JSON файла.');
            }
        };
        reader.readAsText(file);
    },

    resetData() {
        if (confirm('Вы уверены, что хотите полностью сбросить все данные календаря?')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    App.init();
});
