import { auth } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import { kinopoiskAPI } from './apis.js';

// ==========================================
// ТЕМЫ
// ==========================================
const themes = {
  red:    { glow: '255,0,60',   accent: '#ff003c', name: 'Красная' },
  blue:   { glow: '0,102,255',  accent: '#0066ff', name: 'Синяя' },
  green:  { glow: '0,204,102',  accent: '#00cc66', name: 'Зеленая' },
  purple: { glow: '153,51,255', accent: '#9933ff', name: 'Фиолетовая' },
  cyan:   { glow: '0,204,204',  accent: '#00cccc', name: 'Голубая' },
  orange: { glow: '255,102,0',  accent: '#ff6600', name: 'Оранжевая' },
  pink:   { glow: '255,51,153', accent: '#ff3399', name: 'Розовая' },
  yellow: { glow: '255,204,0',  accent: '#ffcc00', name: 'Желтая' }
};

function setTheme(themeName) {
  const t = themes[themeName];
  if (!t) return;

  const root = document.documentElement;
  root.style.setProperty('--glow-color', t.glow);
  root.style.setProperty('--accent-color', t.accent);
  root.style.setProperty('--card-border', `rgba(${t.glow},0.4)`);
  root.style.setProperty('--blob-gradient', `radial-gradient(circle, rgba(${t.glow},0.4) 0%, rgba(${t.glow},0) 70%)`);

  document.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
  const active = document.querySelector(`.color-option[data-color="${themeName}"]`);
  if (active) active.classList.add('active');

  const statusInfo = document.getElementById('statusInfo');
  if (statusInfo) statusInfo.textContent = `SYSTEM: ONLINE | THEME: ${themeName.toUpperCase()}`;

  const themeNameEl = document.getElementById('currentTheme');
  if (themeNameEl) themeNameEl.textContent = t.name;

  localStorage.setItem('theme', themeName);
}

// ==========================================
// АВТОРИЗАЦИЯ
// ==========================================
const authAPI = {
  register: async () => {
    const email = document.getElementById('regUser')?.value.trim();
    const password = document.getElementById('regPass')?.value.trim();
    const errBox = document.getElementById('regError');

    if (!email || !password) return ui.showError(errBox, "Введите Email и пароль");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      ui.closeModal();
      alert("Аккаунт создан.");
    } catch (e) {
      ui.showError(errBox, "Ошибка: " + e.code);
    }
  },

  login: async () => {
    const email = document.getElementById('loginUser')?.value.trim();
    const password = document.getElementById('loginPass')?.value.trim();
    const errBox = document.getElementById('loginError');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      ui.closeModal();
    } catch (e) {
      ui.showError(errBox, "Ошибка: " + e.code);
    }
  },

  logout: async () => {
    await signOut(auth);
  }
};

// ==========================================
// UI
// ==========================================
const ui = {
  get modal() { return document.getElementById('authModal'); },
  get navBtn() { return document.getElementById('navAuthBtn'); },

  openModal: () => ui.modal?.classList.add('active'),

  closeModal: () => {
    ui.modal?.classList.remove('active');
    document.querySelectorAll('.error-msg').forEach(el => (el.style.display = 'none'));
  },

  toggleForms: () => {
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    if (!loginForm || !regForm) return;

    const loginHidden = loginForm.style.display === 'none';
    loginForm.style.display = loginHidden ? 'block' : 'none';
    regForm.style.display = loginHidden ? 'none' : 'block';
  },

  showError: (el, msg) => {
    if (!el) return;
    el.innerText = msg;
    el.style.display = 'block';
  },

  updateAuthUI: (user) => {
    const userInfo = document.getElementById('currentUserInfo');

    if (user) {
      if (ui.navBtn) {
        ui.navBtn.innerText = "ВЫЙТИ";
        ui.navBtn.onclick = authAPI.logout;
      }
      if (userInfo) userInfo.textContent = user.email;
    } else {
      if (ui.navBtn) {
        ui.navBtn.innerText = "ВОЙТИ";
        ui.navBtn.onclick = ui.openModal;
      }
      if (userInfo) userInfo.textContent = 'Guest';
    }
  }
};

// ==========================================
// ДЕМО-ФИЛЬМЫ
// ==========================================
function generateFakeMovies() {
  const grid = document.getElementById('moviesGrid');
  if (!grid || grid.innerHTML.trim()) return;

  const titles = ["CYBERPUNK 2077", "BLADE RUNNER", "DUNE", "TRON", "AKIRA", "MATRIX"];
  grid.innerHTML = Array.from({ length: 12 }).map((_, i) => {
    const t = titles[i % titles.length];
    return `
      <div class="movie-card" onclick="alert('Демо-каталог. Используйте ПОИСК!')">
        <div class="movie-title">${t}</div>
        <div class="movie-card-meta">
          <span class="movie-year">2077</span>
          <span class="movie-demo">DEMO</span>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// ПОИСК
// ==========================================
function performSearch() {
  const query = document.getElementById('globalSearch')?.value.trim();
  if (!query) return alert("Введите название для поиска!");
  kinopoiskAPI.searchByKeyword(query);
}

// ==========================================
// СБРОС
// ==========================================
function resetToDefault() {
  localStorage.removeItem('theme');
  setTheme('red');
}

// ==========================================
// ИСТОРИЯ ПРОСМОТРОВ
// ==========================================
const historyManager = {
  // Получить историю
  getHistory: () => {
    const saved = localStorage.getItem('movieHistory');
    return saved ? JSON.parse(saved) : [];
  },

  // Сохранить фильм в историю
  addToHistory: (movie) => {
    let history = historyManager.getHistory();
    
    // Удаляем дубликаты (если фильм уже был)
    history = history.filter(item => item.filmId !== movie.filmId);
    
    // Добавляем в начало массива
    history.unshift({
      filmId: movie.filmId,
      title: movie.title,
      year: movie.year,
      rating: movie.rating,
      poster: movie.poster,
      viewedAt: new Date().toISOString()
    });
    
    // Ограничиваем историю 50 фильмами
    if (history.length > 50) history = history.slice(0, 50);
    
    localStorage.setItem('movieHistory', JSON.stringify(history));
  },

  // Очистить всю историю
  clearHistory: () => {
    if (!confirm('Удалить всю историю просмотров?')) return;
    localStorage.removeItem('movieHistory');
    historyManager.renderHistory();
  },

  // Удалить один фильм из истории
  removeFromHistory: (filmId) => {
    let history = historyManager.getHistory();
    history = history.filter(item => item.filmId !== filmId);
    localStorage.setItem('movieHistory', JSON.stringify(history));
    historyManager.renderHistory();
  },

  // Отобразить историю на странице
  renderHistory: () => {
    const container = document.getElementById('historyGrid');
    if (!container) return;

    const history = historyManager.getHistory();

    if (history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📽️</div>
          <h2>История пуста</h2>
          <p>Фильмы, которые вы просматривали, появятся здесь</p>
        </div>
      `;
      return;
    }

    container.innerHTML = history.map(movie => {
      const date = new Date(movie.viewedAt);
      const timeAgo = historyManager.getTimeAgo(date);

      return `
        <div class="history-card">
          <div class="history-poster" 
               style="background-image: url('${movie.poster || ''}')"
               onclick="kinopoiskAPI.openFilmModal('${movie.filmId}')">
            ${movie.poster ? '' : '<div class="no-poster">?</div>'}
          </div>
          
          <div class="history-info" onclick="kinopoiskAPI.openFilmModal('${movie.filmId}')">
            <div class="history-title">${movie.title}</div>
            <div class="history-meta">
              <span>${movie.year || '—'}</span>
              <span>★ ${movie.rating || '—'}</span>
            </div>
            <div class="history-date">${timeAgo}</div>
          </div>

          <button class="history-delete" 
                  onclick="event.stopPropagation(); historyManager.removeFromHistory('${movie.filmId}')"
                  title="Удалить из истории">
            ×
          </button>
        </div>
      `;
    }).join('');
  },

  // Вспомогательная функция: "сколько времени назад"
  getTimeAgo: (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'только что';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} дн назад`;
    
    return date.toLocaleDateString('ru-RU');
  }
};

// ==========================================
// ГЛОБАЛЬНЫЕ ФУНКЦИИ
// ==========================================
window.setTheme = setTheme;
window.resetToDefault = resetToDefault;
window.performSearch = performSearch;
window.authAPI = authAPI;
window.ui = ui;
window.kinopoiskAPI = kinopoiskAPI;
window.historyManager = historyManager;

// ==========================================
// ИНИЦИАЛИЗАЦИЯ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setTheme(localStorage.getItem('theme') || 'red');

  onAuthStateChanged(auth, (user) => ui.updateAuthUI(user));

  document.getElementById('closeAuthModal')?.addEventListener('click', ui.closeModal);

  window.addEventListener('click', (e) => {
    if (ui.modal && e.target === ui.modal) ui.closeModal();

    const movieModal = document.getElementById('movieModal');
    if (movieModal && e.target === movieModal) kinopoiskAPI.closeModal();
  });

  const searchInput = document.getElementById('globalSearch');
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }

  generateFakeMovies();

  // Рендерим историю, если на странице history.html
  if (window.location.pathname.includes('history.html')) {
    historyManager.renderHistory();
  }
});