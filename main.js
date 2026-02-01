// main.js

// 1. Импортируем auth из вашего файла (проверьте путь, если файл в папке src, то './firebase')
import { auth } from './firebase'; 

// 2. Импортируем функции из пакета (без ссылок https!)
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "firebase/auth";

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
let currentTheme = 'red';
let movies = [];
let moviesLoaded = false;

// --- ТЕМЫ ---
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

// --- УСТАНОВКА ТЕМЫ ---
function setTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;
    
    currentTheme = themeName;
    
    // Применяем CSS переменные
    document.documentElement.style.setProperty('--glow-color', theme.glow);
    document.documentElement.style.setProperty('--accent-color', theme.accent);
    document.documentElement.style.setProperty('--card-border', `rgba(${theme.glow},0.4)`);
    document.documentElement.style.setProperty('--blob-gradient', `radial-gradient(circle, rgba(${theme.glow},0.4) 0%, rgba(${theme.glow},0) 70%)`);
    
    // 1. Убираем класс active у всех кнопок
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('active');
    });

    // 2. Ищем нужную кнопку по атрибуту и делаем активной
    // Это работает и при клике, и при автоматической загрузке
    const activeBtn = document.querySelector(`.color-option[data-color="${themeName}"]`);
    if(activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Обновляем тексты
    const statusInfo = document.getElementById('statusInfo');
    if(statusInfo) statusInfo.textContent = `SYSTEM: ONLINE | THEME: ${themeName.toUpperCase()}`;
    
    const themeNameEl = document.getElementById('currentTheme');
    if(themeNameEl) themeNameEl.textContent = theme.name;
    
    // Сохраняем
    localStorage.setItem('theme', themeName);
    
    // Вибрация (если есть действие пользователя)
    if (navigator.vibrate) navigator.vibrate(10);
}
// --- СИСТЕМА АВТОРИЗАЦИИ (FIREBASE) ---
const authAPI = {
    register: async () => {
        const email = document.getElementById('regUser').value.trim();
        const password = document.getElementById('regPass').value.trim();
        const errBox = document.getElementById('regError');
        
        if(!email || !password) {
            ui.showError(errBox, "Введите Email и пароль");
            return;
        }
        
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            ui.closeModal();
            alert("ACCESS GRANTED: Аккаунт создан.");
        } catch (error) {
            console.error(error);
            let msg = "Ошибка регистрации";
            if(error.code === 'auth/email-already-in-use') msg = "Email уже занят";
            if(error.code === 'auth/weak-password') msg = "Пароль слишком простой (мин. 6 симв.)";
            if(error.code === 'auth/invalid-email') msg = "Некорректный Email";
            ui.showError(errBox, msg);
        }
    },

    login: async () => {
        const email = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPass').value.trim();
        const errBox = document.getElementById('loginError');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            ui.closeModal();
        } catch (error) {
            console.error(error);
            let msg = "Ошибка входа";
            if(error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                msg = "Неверный Email или пароль";
            }
            if(error.code === 'auth/invalid-email') msg = "Некорректный Email";
            ui.showError(errBox, msg);
        }
    },

    logout: async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Ошибка выхода:", error);
        }
    }
};

const ui = {
    modal: document.getElementById('authModal'),
    navBtn: document.getElementById('navAuthBtn'),
    loginForm: document.getElementById('loginForm'),
    regForm: document.getElementById('registerForm'),

    openModal: () => {
        if(ui.modal) ui.modal.classList.add('active');
        setTimeout(() => {
            const el = document.getElementById('loginUser');
            if(el) el.focus();
        }, 100);
    },
    
    closeModal: () => {
        if(ui.modal) ui.modal.classList.remove('active');
        document.querySelectorAll('.auth-card input').forEach(input => input.value = '');
        document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
        setTimeout(() => {
            if(ui.loginForm) ui.loginForm.style.display = 'block';
            if(ui.regForm) ui.regForm.style.display = 'none';
        }, 300);
    },
    
    toggleForms: () => {
        if(ui.loginForm.style.display === 'none') {
            ui.loginForm.style.display = 'block';
            ui.regForm.style.display = 'none';
            setTimeout(() => document.getElementById('loginUser').focus(), 100);
        } else {
            ui.loginForm.style.display = 'none';
            ui.regForm.style.display = 'block';
            setTimeout(() => document.getElementById('regUser').focus(), 100);
        }
        document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
    },
    
    showError: (element, msg) => {
        if(element) {
            element.innerText = msg;
            element.style.display = 'block';
        } else {
            alert(msg);
        }
    },
    
    updateAuthUI: (user) => {
        const userInfoEl = document.getElementById('currentUserInfo');
        const userCountEl = document.getElementById('userCount');

        if(user) {
            ui.navBtn.innerText = "ВЫЙТИ";
            ui.navBtn.onclick = authAPI.logout; // JS обработчик
            
            if(userInfoEl) userInfoEl.textContent = user.email;
            if(userCountEl) userCountEl.textContent = "CLASSIFIED";
        } else {
            ui.navBtn.innerText = "ВОЙТИ";
            ui.navBtn.onclick = ui.openModal; // JS обработчик
            
            if(userInfoEl) userInfoEl.textContent = 'Не авторизован';
            if(userCountEl) userCountEl.textContent = "UNKNOWN";
        }
    }
};

// Экспортируем функции в глобальную область видимости (window),
// чтобы HTML onclick="..." их видел.
window.setTheme = setTheme;
window.authAPI = authAPI;
window.ui = ui;
window.switchPage = function(pageName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if(window.event) window.event.target.classList.add('active');
    
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    setTimeout(() => {
        const page = document.getElementById(pageName + 'Page');
        if(page) page.classList.add('active');
    }, 50);
    
    if (pageName === 'cinema' && !moviesLoaded) {
        generateMovies();
    }
    if (navigator.vibrate) navigator.vibrate(10);
};

window.resetToDefault = function() {
    setTheme('red');
    localStorage.removeItem('theme');
};

window.performSearch = function() {
    const query = document.getElementById('globalSearch').value.trim();
    if(query) {
        alert(`SCANNING SYSTEM FOR: "${query}"...\n\n[RESULT]: NO MATCH FOUND IN SECTOR 7.`);
    } else {
        alert("SYSTEM ERROR: EMPTY SEARCH QUERY");
    }
}

// --- ФИЛЬМЫ ---
function generateMovies() {
    const movieTitles = [
        "КИБЕРПАНК 2077", "МАТРИЦА", "БЕГУЩИЙ ПО ЛЕЗВИЮ", "ВАЛЛ-И",
        "НАЧАЛО", "ИНТЕРСТЕЛЛАР", "ДЮНА", "АВАТАР", "ГРАВИТАЦИЯ", "МАРСИАНИН",
        "ТЕРМИНАТОР", "ЧУЖОЙ", "ПРОМЕТЕЙ", "БЕЗУМНЫЙ МАКС", "ЗВЕЗДНЫЕ ВОЙНЫ",
        "АВАЛАНЧА", "ОБЛАЧНЫЙ АТЛАС", "ИСТОЧНИК", "ЛЮСИ", "ДЖОННИ МНЕМОНИК"
    ];
    const genres = ["КИБЕРПАНК", "НАУЧНАЯ ФАНТАСТИКА", "ФЭНТЕЗИ", "ЭКШН", "ТРИЛЛЕР"];
    const grid = document.getElementById('moviesGrid');
    if(!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < 20; i++) {
        const title = movieTitles[i % movieTitles.length];
        const year = 1990 + Math.floor(Math.random() * 34);
        const rating = (5 + Math.random() * 5).toFixed(1);
        const movieGenres = [];
        const numGenres = 1 + Math.floor(Math.random() * 2);
        for (let j = 0; j < numGenres; j++) {
            movieGenres.push(genres[Math.floor(Math.random() * genres.length)]);
        }

        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.onclick = () => alert(`Выбран фильм: ${title} (${year})`);
        
        movieCard.innerHTML = `
            <div class="movie-title">${title}</div>
            <div class="movie-year">${year}</div>
            <div class="movie-genres">
                ${movieGenres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
            </div>
            <div class="movie-rating">
                <span>РЕЙТИНГ:</span>
                <span class="rating-value">${rating}/10</span>
            </div>
        `;
        grid.appendChild(movieCard);
    }
    moviesLoaded = true;
}

// --- ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Тема
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && themes[savedTheme]) {
        setTheme(savedTheme);
    } else {
        setTheme('red'); 
    }

    // 2. СЛУШАТЕЛЬ FIREBASE AUTH
    onAuthStateChanged(auth, (user) => {
        console.log("Auth State Changed:", user ? user.email : "Logged out");
        ui.updateAuthUI(user);
    });
    
    // 3. UI Обработчики
    const closeModalBtn = document.getElementById('closeModal');
    if(closeModalBtn) closeModalBtn.onclick = ui.closeModal;
    
    window.onclick = (e) => { 
        if(ui.modal && e.target === ui.modal) ui.closeModal(); 
    }
    
    const searchInput = document.getElementById('globalSearch');
    if(searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if(e.key === 'Enter') performSearch();
        });
    }
    
    // Enter на полях ввода
    ['loginUser', 'loginPass'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('keyup', (e) => {
            if(e.key === 'Enter') authAPI.login();
        });
    });
    
    ['regUser', 'regPass'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('keyup', (e) => {
            if(e.key === 'Enter') authAPI.register();
        });
    });
});