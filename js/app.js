import { auth } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

import { kinopoiskAPI } from './apis.js';
import { t, setLanguage, getCurrentLanguage, applyTranslations } from './lang.js';

const themes = {
  red:    { glow: '255,0,60',   accent: '#ff003c', nameKey: 'themes.red' },
  blue:   { glow: '0,102,255',  accent: '#0066ff', nameKey: 'themes.blue' },
  green:  { glow: '0,204,102',  accent: '#00cc66', nameKey: 'themes.green' },
  purple: { glow: '153,51,255', accent: '#9933ff', nameKey: 'themes.purple' },
  cyan:   { glow: '0,204,204',  accent: '#00cccc', nameKey: 'themes.cyan' },
  orange: { glow: '255,102,0',  accent: '#ff6600', nameKey: 'themes.orange' },
  pink:   { glow: '255,51,153', accent: '#ff3399', nameKey: 'themes.pink' },
  yellow: { glow: '255,204,0',  accent: '#ffcc00', nameKey: 'themes.yellow' }
};

function setTheme(themeName) {
  const tTheme = themes[themeName];
  if (!tTheme) return;

  const root = document.documentElement;
  root.style.setProperty('--glow-color', tTheme.glow);
  root.style.setProperty('--accent-color', tTheme.accent);
  root.style.setProperty('--card-border', `rgba(${tTheme.glow},0.4)`);
  root.style.setProperty('--blob-gradient', `radial-gradient(circle, rgba(${tTheme.glow},0.4) 0%, rgba(${tTheme.glow},0) 70%)`);

  document.querySelectorAll('.color-option').forEach(el => el.classList.remove('active'));
  const active = document.querySelector(`.color-option[data-color="${themeName}"]`);
  if (active) active.classList.add('active');

  const statusInfo = document.getElementById('statusInfo');
  if (statusInfo) statusInfo.textContent = t('search.systemOnline');

  const themeNameEl = document.getElementById('currentTheme');
  if (themeNameEl) themeNameEl.textContent = t(tTheme.nameKey);

  localStorage.setItem('theme', themeName);
}

const ui = {
  get modal() { return document.getElementById('authModal'); },
  get navBtn() { return document.getElementById('navAuthBtn'); },
  get mobileNavBtn() { return document.getElementById('mobileAuthBtn'); },
  get mobileMenu() { return document.getElementById('mobileMenu'); },
  get mobileMenuToggle() { return document.getElementById('mobileMenuToggle'); },

  clearAuthFields: () => {
    const ids = ['loginUser', 'loginPass', 'regUser', 'regPass'];
    ids.forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });

    document.querySelectorAll('.error-msg').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  },

  showRegisterForm: () => {
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    if (!loginForm || !regForm) return;

    loginForm.style.display = 'none';
    regForm.style.display = 'block';
  },

  showLoginForm: () => {
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    if (!loginForm || !regForm) return;

    loginForm.style.display = 'block';
    regForm.style.display = 'none';
  },

  openModal: () => {
    ui.clearAuthFields();
    ui.showRegisterForm();
    ui.modal?.classList.add('active');
  },

  closeModal: () => {
    ui.modal?.classList.remove('active');
    ui.clearAuthFields();
    ui.showRegisterForm();
  },

  toggleForms: () => {
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    if (!loginForm || !regForm) return;

    const registerVisible = regForm.style.display !== 'none';

    if (registerVisible) {
      ui.showLoginForm();
    } else {
      ui.showRegisterForm();
    }

    document.querySelectorAll('.error-msg').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
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
        ui.navBtn.innerText = t('nav.logout');
        ui.navBtn.onclick = authAPI.logout;
      }
      if (ui.mobileNavBtn) {
        ui.mobileNavBtn.innerText = t('nav.logout');
        ui.mobileNavBtn.onclick = authAPI.logout;
      }
      if (userInfo) userInfo.textContent = user.email;
    } else {
      if (ui.navBtn) {
        ui.navBtn.innerText = t('nav.login');
        ui.navBtn.onclick = ui.openModal;
      }
      if (ui.mobileNavBtn) {
        ui.mobileNavBtn.innerText = t('nav.login');
        ui.mobileNavBtn.onclick = () => {
          ui.closeMobileMenu();
          ui.openModal();
        };
      }
      if (userInfo) userInfo.textContent = t('settings.guest');
    }
  },

  toggleMobileMenu: () => {
    ui.mobileMenu?.classList.toggle('active');
    ui.mobileMenuToggle?.classList.toggle('active');
  },

  closeMobileMenu: () => {
    ui.mobileMenu?.classList.remove('active');
    ui.mobileMenuToggle?.classList.remove('active');
  }
};

const authAPI = {
  register: async () => {
    const email = document.getElementById('regUser')?.value.trim();
    const password = document.getElementById('regPass')?.value.trim();
    const errBox = document.getElementById('regError');

    if (!email || !password) {
      return ui.showError(errBox, t('auth.enterCredentials'));
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      ui.closeModal();
      alert(t('auth.accountCreated'));
    } catch (e) {
      ui.showError(errBox, `${t('auth.errorPrefix')}${e.code}`);
    }
  },

  login: async () => {
    const email = document.getElementById('loginUser')?.value.trim();
    const password = document.getElementById('loginPass')?.value.trim();
    const errBox = document.getElementById('loginError');

    if (!email || !password) {
      return ui.showError(errBox, t('auth.enterCredentials'));
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      ui.closeModal();
    } catch (e) {
      ui.showError(errBox, `${t('auth.errorPrefix')}${e.code}`);
    }
  },

  logout: async () => {
    await signOut(auth);
    ui.clearAuthFields();
    ui.showRegisterForm();
  }
};

function loadCatalog() {
  kinopoiskAPI.loadCatalog();
}

function performSearch() {
  const query = document.getElementById('globalSearch')?.value.trim();
  if (!query) return alert(t('search.enterQuery'));
  kinopoiskAPI.searchByKeyword(query);
}

function resetToDefault() {
  localStorage.removeItem('theme');
  setTheme('red');
}

function changeLanguage(lang) {
  setLanguage(lang);
  applyTranslations();
  syncDynamicTexts();
  historyManager.renderHistory();
  if (document.getElementById('moviesGrid')) loadCatalog();
}

function syncDynamicTexts() {
  const currentTheme = localStorage.getItem('theme') || 'red';
  setTheme(currentTheme);
  ui.updateAuthUI(window.currentUser || null);

  const playerLabel = document.getElementById('playerLabel');
  if (playerLabel) playerLabel.textContent = t('movie.videoUplink');

  const langSelect = document.getElementById('languageSelect');
  if (langSelect) langSelect.value = getCurrentLanguage();
}

const historyManager = {
  getHistory: () => {
    const saved = localStorage.getItem('movieHistory');
    return saved ? JSON.parse(saved) : [];
  },

  addToHistory: (movie) => {
    let history = historyManager.getHistory();

    history = history.filter(item => item.filmId !== movie.filmId);

    history.unshift({
      filmId: movie.filmId,
      title: movie.title,
      year: movie.year,
      rating: movie.rating,
      poster: movie.poster,
      viewedAt: new Date().toISOString()
    });

    if (history.length > 50) history = history.slice(0, 50);

    localStorage.setItem('movieHistory', JSON.stringify(history));
  },

  clearHistory: () => {
    if (!confirm(t('history.deleteConfirm'))) return;
    localStorage.removeItem('movieHistory');
    historyManager.renderHistory();
  },

  removeFromHistory: (filmId) => {
    let history = historyManager.getHistory();
    history = history.filter(item => item.filmId !== filmId);
    localStorage.setItem('movieHistory', JSON.stringify(history));
    historyManager.renderHistory();
  },

  renderHistory: () => {
    const container = document.getElementById('historyGrid');
    if (!container) return;

    const history = historyManager.getHistory();

    if (history.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📽️</div>
          <h2>${t('history.empty')}</h2>
          <p>${t('history.emptyDesc')}</p>
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
              <span>${movie.year || t('common.yearFallback')}</span>
              <span>★ ${movie.rating || t('common.ratingFallback')}</span>
            </div>
            <div class="history-date">${timeAgo}</div>
          </div>

          <button class="history-delete"
                  onclick="event.stopPropagation(); historyManager.removeFromHistory('${movie.filmId}')"
                  title="${t('history.deleteTitle')}">
            ×
          </button>
        </div>
      `;
    }).join('');
  },

  getTimeAgo: (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return t('history.justNow');
    if (seconds < 3600) return `${Math.floor(seconds / 60)} ${t('history.minAgo')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${t('history.hourAgo')}`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ${t('history.dayAgo')}`;

    return date.toLocaleDateString(getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US');
  }
};

window.setTheme = setTheme;
window.resetToDefault = resetToDefault;
window.performSearch = performSearch;
window.authAPI = authAPI;
window.ui = ui;
window.kinopoiskAPI = kinopoiskAPI;
window.historyManager = historyManager;
window.changeLanguage = changeLanguage;

document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();
  setTheme(localStorage.getItem('theme') || 'red');
  syncDynamicTexts();
  ui.showRegisterForm();
  ui.clearAuthFields();

  onAuthStateChanged(auth, (user) => {
    window.currentUser = user;
    ui.updateAuthUI(user);

    if (document.getElementById('moviesGrid')) loadCatalog();
  });

  document.getElementById('closeAuthModal')?.addEventListener('click', ui.closeModal);
  document.getElementById('mobileMenuToggle')?.addEventListener('click', ui.toggleMobileMenu);

  document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', ui.closeMobileMenu);
  });

  window.addEventListener('click', (e) => {
    if (ui.modal && e.target === ui.modal) ui.closeModal();

    const movieModal = document.getElementById('movieModal');
    if (movieModal && e.target === movieModal) kinopoiskAPI.closeModal();

    if (ui.mobileMenu && ui.mobileMenu.classList.contains('active')) {
      const insideMenu = e.target.closest('.mobile-menu, .mobile-menu-toggle');
      if (!insideMenu) ui.closeMobileMenu();
    }
  });

  const searchInput = document.getElementById('globalSearch');
  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }

  if (document.getElementById('moviesGrid')) loadCatalog();
  if (window.location.pathname.includes('history.html')) historyManager.renderHistory();
});

 

let boomPlayer = null;
let boomApiLoaded = false;
let boomTimeout = null;

function loadYouTubeAPI() {
  if (boomApiLoaded || window.YT) return;

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.body.appendChild(tag);

  boomApiLoaded = true;
}

function openBoomVideo(event) {
  event.preventDefault();

  const modal = document.getElementById('boomPlayerModal');
  if (!modal) return;

  modal.classList.add('active');

  if (modal.requestFullscreen) {
    modal.requestFullscreen().catch(() => {});
  } else if (modal.webkitRequestFullscreen) {
    modal.webkitRequestFullscreen();
  } else if (modal.msRequestFullscreen) {
    modal.msRequestFullscreen();
  }

  if (boomPlayer && typeof boomPlayer.playVideo === 'function') {
    boomPlayer.seekTo(0);
    boomPlayer.playVideo();
  } else {
    loadYouTubeAPI();
  }

  clearTimeout(boomTimeout);
  boomTimeout = setTimeout(() => {
    closeBoomVideo();
  }, 2450);
}

function closeBoomVideo() {
  const modal = document.getElementById('boomPlayerModal');
  if (!modal) return;

  modal.classList.remove('active');
  clearTimeout(boomTimeout);

  if (boomPlayer && typeof boomPlayer.stopVideo === 'function') {
    boomPlayer.stopVideo();
  }

  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
}

function onYouTubeIframeAPIReady() {
  boomPlayer = new YT.Player('boomYoutubePlayer', {
    videoId: 'q-X9LN4lSQg',
    playerVars: {
      autoplay: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1
    },
    events: {
      onReady: (event) => {
        event.target.playVideo();
      }
    }
  });
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
window.openBoomVideo = openBoomVideo;
window.closeBoomVideo = closeBoomVideo;