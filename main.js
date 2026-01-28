
    // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
    let currentTheme = 'red';
    let movies = [];
    let moviesLoaded = false;

    // --- ТЕМЫ ---
    const themes = {
        red: {
            glow: '255,0,60',
            accent: '#ff003c',
            name: 'Красная'
        },
        blue: {
            glow: '0,102,255',
            accent: '#0066ff',
            name: 'Синяя'
        },
        green: {
            glow: '0,204,102',
            accent: '#00cc66',
            name: 'Зеленая'
        },
        purple: {
            glow: '153,51,255',
            accent: '#9933ff',
            name: 'Фиолетовая'
        },
        cyan: {
            glow: '0,204,204',
            accent: '#00cccc',
            name: 'Голубая'
        },
        orange: {
            glow: '255,102,0',
            accent: '#ff6600',
            name: 'Оранжевая'
        },
        pink: {
            glow: '255,51,153',
            accent: '#ff3399',
            name: 'Розовая'
        },
        yellow: {
            glow: '255,204,0',
            accent: '#ffcc00',
            name: 'Желтая'
        }
    };

    // --- УСТАНОВКА ТЕМЫ ---
    function setTheme(themeName) {
        const theme = themes[themeName];
        if (!theme) return;
        
        currentTheme = themeName;
        
        // Обновляем CSS переменные
        document.documentElement.style.setProperty('--glow-color', theme.glow);
        document.documentElement.style.setProperty('--accent-color', theme.accent);
        document.documentElement.style.setProperty('--card-border', `rgba(${theme.glow},0.4)`);
        document.documentElement.style.setProperty('--blob-gradient', `radial-gradient(circle, rgba(${theme.glow},0.4) 0%, rgba(${theme.glow},0) 70%)`);
        
        // Обновляем активную кнопку темы
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Обновляем статус
        document.getElementById('statusInfo').textContent = `SYSTEM: ONLINE | THEME: ${themeName.toUpperCase()}`;
        document.getElementById('currentTheme').textContent = theme.name;
        
        // Сохраняем в localStorage
        localStorage.setItem('theme', themeName);
        
        // Вибрация
        if (navigator.vibrate) navigator.vibrate(10);
    }

    // --- СБРОС ТЕМЫ ---
    function resetToDefault() {
        setTheme('red');
        localStorage.removeItem('theme');
    }

    // --- ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ ---
    function switchPage(pageName) {
        // Обновляем активные кнопки навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Переключаем страницы
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        setTimeout(() => {
            document.getElementById(pageName + 'Page').classList.add('active');
        }, 50);
        
        // Загружаем фильмы если нужно
        if (pageName === 'cinema' && !moviesLoaded) {
            generateMovies();
        }
        
        // Вибрация
        if (navigator.vibrate) navigator.vibrate(10);
    }

    // --- СИСТЕМА АВТОРИЗАЦИИ ---
    const authAPI = {
        getUsers: () => JSON.parse(localStorage.getItem('cyberUsers') || '[]'),
        
        register: () => {
            const u = document.getElementById('regUser').value.trim();
            const p = document.getElementById('regPass').value.trim();
            const errBox = document.getElementById('regError');
            
            if(!u || !p) {
                ui.showError(errBox, "Заполните все поля");
                return;
            }
            
            const users = authAPI.getUsers();
            if(users.find(user => user.login === u)) {
                ui.showError(errBox, "Логин занят");
                return;
            }

            users.push({ login: u, password: p });
            localStorage.setItem('cyberUsers', JSON.stringify(users));
            alert("Аккаунт создан!");
            ui.toggleForms();
            ui.updateUserInfo();
        },

        login: () => {
            const u = document.getElementById('loginUser').value.trim();
            const p = document.getElementById('loginPass').value.trim();
            const errBox = document.getElementById('loginError');
            const users = authAPI.getUsers();
            const user = users.find(acc => acc.login === u && acc.password === p);

            if(user) {
                localStorage.setItem('currentUser', u);
                ui.closeModal();
                ui.checkAuth();
                ui.updateUserInfo();
            } else {
                ui.showError(errBox, "Неверный логин или пароль");
            }
        },

        logout: () => {
            localStorage.removeItem('currentUser');
            ui.checkAuth();
            ui.updateUserInfo();
        },

        resetDB: () => {
            if(confirm('Вы уверены? Это удалит ВСЕ зарегистрированные аккаунты.')) {
                localStorage.clear(); 
                location.reload();
            }
        }
    };

    const ui = {
        modal: document.getElementById('authModal'),
        navBtn: document.getElementById('navAuthBtn'),
        loginForm: document.getElementById('loginForm'),
        regForm: document.getElementById('registerForm'),

        openModal: () => {
            ui.modal.classList.add('active');
            setTimeout(() => document.getElementById('loginUser').focus(), 100);
        },
        
        closeModal: () => {
            ui.modal.classList.remove('active');
            document.querySelectorAll('.auth-card input').forEach(input => input.value = '');
            document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
            setTimeout(() => {
                ui.loginForm.style.display = 'block';
                ui.regForm.style.display = 'none';
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
            element.innerText = msg;
            element.style.display = 'block';
        },
        
        checkAuth: () => {
            const currentUser = localStorage.getItem('currentUser');
            if(currentUser) {
                ui.navBtn.innerText = currentUser + " / ВЫЙТИ";
                ui.navBtn.onclick = authAPI.logout;
            } else {
                ui.navBtn.innerText = "ВОЙТИ";
                ui.navBtn.onclick = ui.openModal;
            }
        },
         
        updateUserInfo: () => {
            const currentUser = localStorage.getItem('currentUser');
            const users = authAPI.getUsers();
            
            document.getElementById('currentUserInfo').textContent = 
                currentUser ? currentUser : 'Не авторизован';
            document.getElementById('userCount').textContent = users.length;
        }
    };

    // --- ПОИСК ---
    function performSearch() {
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

    // --- ИНИЦИАЛИЗАЦИЯ ---
    document.addEventListener('DOMContentLoaded', () => {
        // Загрузка сохраненной темы
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && themes[savedTheme]) {
            setTheme(savedTheme);
            document.querySelector(`.color-option[data-color="${savedTheme}"]`).classList.add('active');
        }
        
        // Инициализация UI
        ui.checkAuth();
        ui.updateUserInfo();
        
        // Обработчики событий
        document.getElementById('closeModal').onclick = ui.closeModal;
        window.onclick = (e) => { if(e.target === ui.modal) ui.closeModal(); }
        
        document.getElementById('globalSearch').addEventListener('keyup', (e) => {
            if(e.key === 'Enter') performSearch();
        });
        
        // Обработчики Enter для форм
        ['loginUser', 'loginPass'].forEach(id => {
            document.getElementById(id).addEventListener('keyup', (e) => {
                if(e.key === 'Enter') authAPI.login();
            });
        });
        
        ['regUser', 'regPass'].forEach(id => {
            document.getElementById(id).addEventListener('keyup', (e) => {
                if(e.key === 'Enter') authAPI.register();
            });
        });
    });
