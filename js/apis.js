export const kinopoiskAPI = {
  key: '97902904-1707-4ced-9ece-d2c5a54c9421',

// поиск по слову
  searchByKeyword: async (query) => {
    const url = `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}`;
    const resultContainer = document.getElementById('apiResult');
    
    if(resultContainer) resultContainer.innerHTML = '<div class="status">SCANNING DATABASE...</div>';
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'X-API-KEY': kinopoiskAPI.key, 
          'Content-Type': 'application/json' 
        },
      });
      const data = await response.json();
      kinopoiskAPI.renderSearchResults(data);
    } catch (error) {
      console.error(error);
      if(resultContainer) resultContainer.innerHTML = `<div class="status" style="color:red">ERROR: ${error.message}</div>`;
    }
  },

// результаты
  renderSearchResults: (data) => {
    const container = document.getElementById('apiResult');
    if (!container) return;
    
    if (!data.films || data.films.length === 0) {
      container.innerHTML = '<div class="status">RESULT: 0 MATCHES.</div>';
      return;
    }
    
    let html = `<div class="status" style="margin-bottom:10px;">FOUND: ${data.films.length} OBJECTS</div>`;
    
    data.films.forEach(film => {
      const year = film.year || 'N/A';
      const rating = film.rating && film.rating !== 'null' ? film.rating : '-';
      const title = film.nameRu || film.nameEn || 'UNNAMED';
      const poster = film.posterUrlPreview || '';
      
      html += `
        <div class="movie-card enhanced" onclick="kinopoiskAPI.openFilmModal('${film.filmId}')">
          <div class="movie-poster" style="background-image: url('${poster}')">
            ${poster ? '' : '<div class="no-poster-icon">🎬</div>'}
            <div class="movie-rating-badge">★ ${rating}</div>
          </div>
          <div class="movie-card-body">
            <div class="movie-title">${title}</div>
            <div class="movie-year">${year}</div>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  },

// популярное
  loadCatalog: async () => {
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="status">ЗАГРУЗКА КАТАЛОГА...</div>';

    try {
      const url = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/collections?type=TOP_250_MOVIES&page=1';
      const response = await fetch(url, {
        headers: { 'X-API-KEY': kinopoiskAPI.key }
      });
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        grid.innerHTML = '<div class="status">Каталог пуст</div>';
        return;
      }

      grid.innerHTML = data.items.map(film => {
        const title = film.nameRu || film.nameEn || 'Без названия';
        const year = film.year || '—';
        const rating = film.ratingKinopoisk || film.ratingImdb || '—';
        const poster = film.posterUrlPreview || '';

        return `
          <div class="movie-card enhanced" onclick="kinopoiskAPI.openFilmModal('${film.kinopoiskId}')">
            <div class="movie-poster" style="background-image: url('${poster}')">
              ${poster ? '' : '<div class="no-poster-icon">🎬</div>'}
              <div class="movie-rating-badge">★ ${rating}</div>
            </div>
            <div class="movie-card-body">
              <div class="movie-title">${title}</div>
              <div class="movie-year">${year}</div>
            </div>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error(error);
      grid.innerHTML = `<div class="status" style="color:red">ОШИБКА: ${error.message}</div>`;
    }
  },

  // модалка фильма
  openFilmModal: async (filmId) => {
    const modal = document.getElementById('movieModal');
    modal.classList.add('active');
    
    // Сброс
    document.getElementById('modalTitle').textContent = "ЗАГРУЗКА...";
    document.getElementById('modalDesc').textContent = "Поиск данных...";
    document.getElementById('modalPoster').src = ""; 
    document.getElementById('modalRating').textContent = "-";
    document.getElementById('modalYear').textContent = "";
    
    // Скрываем плеер
    const player = document.getElementById('modalPlayer');
    player.src = "";
    player.style.display = 'none';
    
    const oldMsg = document.getElementById('videoControls');
    if(oldMsg) oldMsg.remove();

    // Очищаем доп. секции
    const seasonsContainer = document.getElementById('seasonsContainer');
    const factsContainer = document.getElementById('factsContainer');
    const similarsContainer = document.getElementById('similarsContainer');
    if (seasonsContainer) seasonsContainer.innerHTML = '';
    if (factsContainer) factsContainer.innerHTML = '';
    if (similarsContainer) similarsContainer.innerHTML = '';
    
    try {
      //  ЗАПРОС 1: Основная информация 
      const urlInfo = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${filmId}`;
      const responseInfo = await fetch(urlInfo, {
        headers: { 'X-API-KEY': kinopoiskAPI.key }
      });
      const data = await responseInfo.json();
      
      const name = data.nameRu || data.nameEn || data.nameOriginal || 'Без названия';
      const genres = data.genres ? data.genres.map(g => g.genre).join(', ') : '-';
      const countries = data.countries ? data.countries.map(c => c.country).join(', ') : '-';
      
      document.getElementById('modalTitle').textContent = name;
      document.getElementById('modalYear').textContent = `${data.year || '—'} | ${genres} | ${countries}`;
      document.getElementById('modalRating').textContent = data.ratingKinopoisk || data.ratingImdb || "-";
      document.getElementById('modalDesc').textContent = data.description || "Описание отсутствует.";
      document.getElementById('modalPoster').src = data.posterUrl || '';

      // Сохраняем в историю
      if (window.historyManager) {
        window.historyManager.addToHistory({
          filmId: filmId,
          title: name,
          year: data.year,
          rating: data.ratingKinopoisk || data.ratingImdb || null,
          poster: data.posterUrl
        });
      }

      //  ЗАПРОС 2: Видео
      const urlVideo = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${filmId}/videos`;
      const responseVideo = await fetch(urlVideo, {
        headers: { 'X-API-KEY': kinopoiskAPI.key }
      });
      const dataVideo = await responseVideo.json();
      
      let finalUrl = "";
      
      if (dataVideo.items && dataVideo.items.length > 0) {
        const youtubeVideo = dataVideo.items.find(v => v.site === 'YOUTUBE' && v.url.includes('watch?v='));
        if (youtubeVideo) {
          const videoId = youtubeVideo.url.split('v=')[1].split('&')[0];
          finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }
      }
      
      if (!finalUrl) {
        finalUrl = `https://www.youtube.com/embed?listType=search&list=trailer+${encodeURIComponent(name)}&autoplay=1`;
      }
      
      const playerWrapper = document.querySelector('.player-wrapper');
      const controls = document.createElement('div');
      controls.id = 'videoControls';
      controls.style.padding = '40px';
      controls.style.textAlign = 'center';
      
      controls.innerHTML = `
        <div style="opacity:0.7; margin-bottom:15px; font-size:12px; color: #fff;">МЕДИА-ФАЙЛ ГОТОВ</div>
        <button onclick="kinopoiskAPI.playVideo('${finalUrl}')" 
          style="
            padding:12px 40px; 
            background:var(--accent-color); 
            color:#000; 
            border:none;
            cursor:pointer;
            font-weight:900; 
            font-size: 14px;
            font-family:'Orbitron';
            border-radius: 4px;
            box-shadow: 0 0 20px rgba(var(--glow-color), 0.6);
            transition: transform 0.2s;
          "
          onmouseover="this.style.transform='scale(1.05)'"
          onmouseout="this.style.transform='scale(1)'"
        >
          СМОТРЕТЬ ТРЕЙЛЕР
        </button>
      `;
      
      playerWrapper.appendChild(controls);

      // ЗАПРОС 3: Сезоны
      if (data.serial) {
        kinopoiskAPI.loadSeasons(filmId);
      }

      // ЗАПРОС 4: Факты
      kinopoiskAPI.loadFacts(filmId);

      // ЗАПРОС 5: Похожие фильмы
      kinopoiskAPI.loadSimilars(filmId);
      
    } catch (error) {
      console.error(error);
      document.getElementById('modalTitle').textContent = "ОШИБКА ЗАГРУЗКИ";
      document.getElementById('modalDesc').textContent = error.message;
    }
  },

// загрузка сезонов
  loadSeasons: async (filmId) => {
    const container = document.getElementById('seasonsContainer');
    if (!container) return;

    try {
      const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${filmId}/seasons`;
      const response = await fetch(url, {
        headers: { 'X-API-KEY': kinopoiskAPI.key }
      });
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        container.innerHTML = '<div class="info-block-empty">Информация о сезонах недоступна</div>';
        return;
      }

      let html = '<div class="info-block-title">📺 СЕЗОНЫ</div>';
      
      data.items.forEach(season => {
        html += `
          <div class="season-item">
            <div class="season-number">Сезон ${season.number}</div>
            <div class="season-episodes">${season.episodes.length} эпизодов</div>
          </div>
        `;
      });

      container.innerHTML = html;
    } catch (error) {
      console.error('Ошибка загрузки сезонов:', error);
    }
  },

// загрузка фактов
  loadFacts: async (filmId) => {
    const container = document.getElementById('factsContainer');
    if (!container) return;

    try {
      const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${filmId}/facts`;
      const response = await fetch(url, {
        headers: { 'X-API-KEY': kinopoiskAPI.key }
      });
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        container.innerHTML = '<div class="info-block-empty">Фактов пока нет</div>';
        return;
      }

      let html = '<div class="info-block-title">💡 ИНТЕРЕСНЫЕ ФАКТЫ</div>';
      
      data.items.slice(0, 5).forEach(fact => {
        const cleanText = fact.text.replace(/<\/?[^>]+(>|$)/g, ""); // Удаляем HTML теги
        html += `<div class="fact-item">${cleanText}</div>`;
      });

      container.innerHTML = html;
    } catch (error) {
      console.error('Ошибка загрузки фактов:', error);
    }
  },

// загрузка похожих
  loadSimilars: async (filmId) => {
    const container = document.getElementById('similarsContainer');
    if (!container) return;

    try {
      const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${filmId}/similars`;
      const response = await fetch(url, {
        headers: { 'X-API-KEY': kinopoiskAPI.key }
      });
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        container.innerHTML = '<div class="info-block-empty">Похожих фильмов не найдено</div>';
        return;
      }

      let html = '<div class="info-block-title">🎬 ПОХОЖИЕ ФИЛЬМЫ</div><div class="similars-grid">';
      
      data.items.slice(0, 6).forEach(film => {
        const title = film.nameRu || film.nameEn || 'Без названия';
        const poster = film.posterUrlPreview || '';

        html += `
          <div class="similar-card" onclick="kinopoiskAPI.openFilmModal('${film.filmId}')">
            <div class="similar-poster" style="background-image: url('${poster}')">
              ${poster ? '' : '<div class="no-poster-icon-small">🎬</div>'}
            </div>
            <div class="similar-title">${title}</div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;
    } catch (error) {
      console.error('Ошибка загрузки похожих фильмов:', error);
    }
  },

  // запустить видео
  playVideo: (url) => {
    const player = document.getElementById('modalPlayer');
    const controls = document.getElementById('videoControls');
    
    player.src = url;
    player.style.display = 'block';
    
    if(controls) controls.remove();
  },

  // закрыть модалку
  closeModal: () => {
    const modal = document.getElementById('movieModal');
    modal.classList.remove('active');
    
    setTimeout(() => {
      const player = document.getElementById('modalPlayer');
      player.src = ""; 
      const controls = document.getElementById('videoControls');
      if(controls) controls.remove();
    }, 300);
  }
};