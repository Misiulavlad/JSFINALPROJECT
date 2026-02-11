// ==========================================
// 1. ИМПОРТЫ
// ==========================================
import { auth } from './firebase'; 
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "firebase/auth";

// ИМПОРТИРУЕМ API ИЗ НОВОГО ФАЙЛА
import { kinopoiskAPI } from './apis.js'; 

// ==========================================
// 2. НАСТРОЙКИ И ТЕМЫ
// ==========================================
const themes = {
    red: { glow: '255,0,60', accent: '#ff003c', name: 'Красная' },
    blue: { glow: '0,102,255', accent: '#0066ff', name: 'Синяя' },
    green: { glow: '0,204,102', accent: '#00cc66', name: 'Зеленая' },
    purple: { glow: '153,51,255', accent: '#9933ff', name: 'Фиолетовая' },
    cyan: { glow: '0,204,204', accent: '#00cccc', name: 'Голубая' },
    orange: { glow: '255,102,0', accent: '#ff6600', name: 'Оранжевая' },
    pink: { glow: '255,51,153', accent: '#ff3399', name: 'Розовая' },
    yellow: { glow: '255,204,0', accent: '#ffcc00', name: 'Желтая' }
};

function setTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    
    document.documentElement.style.setProperty('--glow-color', theme.glow);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
    document.documentElement.style.setProperty('--card-border', `rgba(${theme.glow},0.4)`);
    document.documentElement.style.setProperty('--blob-gradient', `radial-gradient(circle, rgba(${theme.glow},0.4) 0%, rgba(${theme.glow},0) 70%)`);
    
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
    const activeBtn = document.querySelector(`.color-option[data-color="${themeName}"]`);
    if(activeBtn) activeBtn.classList.add('active');
    
    const statusInfo = document.getElementById('statusInfo');
    if(statusInfo) statusInfo.textContent = `SYSTEM: ONLINE | THEME: ${themeName.toUpperCase()}`;
    const themeNameEl = document.getElementById('currentTheme');
    if(themeNameEl) themeNameEl.textContent = theme.name;
    
    localStorage.setItem('theme', themeName);
}

// ==========================================
// 3. АВТОРИЗАЦИЯ
// ==========================================
const authAPI = {
    register: async () => {
        const email = document.getElementById('regUser').value.trim();
        const password = document.getElementById('regPass').value.trim();
        const errBox = document.getElementById('regError');
        if(!email || !password) { ui.showError(errBox, "Введите Email и пароль"); return; }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            ui.closeModal();
            alert("ACCESS GRANTED: Аккаунт создан.");
        } catch (error) { ui.showError(errBox, "Ошибка: " + error.code); }
    },
    login: async () => {
        const email = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPass').value.trim();
        const errBox = document.getElementById('loginError');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            ui.closeModal();
        } catch (error) { ui.showError(errBox, "Ошибка: " + error.code); }
    },
    logout: async () => { await signOut(auth); }
};

const ui = {
    modal: document.getElementById('authModal'),
    navBtn: document.getElementById('navAuthBtn'),
    loginForm: document.getElementById('loginForm'),
    regForm: document.getElementById('registerForm'),

    openModal: () => { if(ui.modal) ui.modal.classList.add('active'); },
    closeModal: () => { 
        if(ui.modal) ui.modal.classList.remove('active'); 
        document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
    },
    toggleForms: () => {
        if(ui.loginForm.style.display === 'none') {
            ui.loginForm.style.display = 'block'; ui.regForm.style.display = 'none';
        } else {
            ui.loginForm.style.display = 'none'; ui.regForm.style.display = 'block';
        }
    },
    showError: (element, msg) => { if(element) { element.innerText = msg; element.style.display = 'block'; } },
    updateAuthUI: (user) => {
        const userInfoEl = document.getElementById('currentUserInfo');
        if(user) {
            ui.navBtn.innerText = "ВЫЙТИ"; ui.navBtn.onclick = authAPI.logout;
            if(userInfoEl) userInfoEl.textContent = user.email;
        } else {
            ui.navBtn.innerText = "ВОЙТИ"; ui.navBtn.onclick = ui.openModal;
            if(userInfoEl) userInfoEl.textContent = 'Guest';
        }
    }
};

// ==========================================
// 4. ГЛОБАЛЬНЫЕ ФУНКЦИИ (ДЛЯ HTML)
// ==========================================
window.setTheme = setTheme;
window.authAPI = authAPI;
window.ui = ui;

// ПРИСВАИВАЕМ ИМПОРТИРОВАННЫЙ API В WINDOW
window.kinopoiskAPI = kinopoiskAPI; 

window.switchPage = function(pageName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if(window.event && window.event.target) window.event.target.classList.add('active');
    
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    setTimeout(() => {
        const page = document.getElementById(pageName + 'Page');
        if(page) page.classList.add('active');
    }, 50);

    if(pageName === 'cinema' && document.getElementById('moviesGrid').innerHTML.trim() === '') {
        generateFakeMovies();
    }
};

window.resetToDefault = function() {
    setTheme('red');
    localStorage.removeItem('theme');
};

// Функция возврата на главную (очистка)
window.resetToMain = function() {
    window.switchPage('search');
    const input = document.getElementById('globalSearch');
    if (input) input.value = '';
    const results = document.getElementById('apiResult');
    if (results) results.innerHTML = '';
};

window.performSearch = function() {
    const query = document.getElementById('globalSearch').value.trim();
    if(query) {
        kinopoiskAPI.searchByKeyword(query);
    } else {
        alert("Введите название для поиска!");
    }
};

function generateFakeMovies() {
    const grid = document.getElementById('moviesGrid');
    const titles = ["CYBERPUNK 2077", "BLADE RUNNER", "DUNE", "TRON", "AKIRA", "MATRIX"];
    let html = '';
    for(let i=0; i<12; i++) {
        const t = titles[i % titles.length];
        html += `
            <div class="movie-card" onclick="alert('Демо-каталог. Используйте ПОИСК!')">
                <div class="movie-title">${t}</div>
                <div style="display:flex; justify-content:space-between; margin-top:5px; opacity:0.7; font-size:12px;">
                    <span class="movie-year">2077</span>
                    <span style="color:var(--accent-color)">DEMO</span>
                </div>
            </div>
        `;
    }
    grid.innerHTML = html;
}

// ==========================================
// 5. ИНИЦИАЛИЗАЦИЯ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'red';
    setTheme(savedTheme);

    onAuthStateChanged(auth, (user) => { ui.updateAuthUI(user); });
    
    const closeAuthBtn = document.getElementById('closeAuthModal');
    if(closeAuthBtn) closeAuthBtn.onclick = ui.closeModal;
    
    window.onclick = (e) => { 
        if(ui.modal && e.target === ui.modal) ui.closeModal(); 
        const movieModal = document.getElementById('movieModal');
        if(movieModal && e.target === movieModal) kinopoiskAPI.closeModal();
    }
    
    const searchInput = document.getElementById('globalSearch');
    if(searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if(e.key === 'Enter') performSearch();
        });
    }
});