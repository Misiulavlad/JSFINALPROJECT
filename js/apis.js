export const kinopoiskAPI = {
    key: '97902904-1707-4ced-9ece-d2c5a54c9421',
  
    // Поиск по ключевому слову
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
  
    // Отобразить результаты поиска
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
        
        html += `
          <div class="movie-card" onclick="kinopoiskAPI.openFilmModal('${film.filmId}')">
            <div class="movie-title">${title}</div>
            <div style="display:flex; justify-content:space-between; margin-top:5px; opacity:0.7; font-size:12px;">
              <span>${year}</span>
              <span style="color:var(--accent-color)">★ ${rating}</span>
            </div>
          </div>
        `;
      });
      
      container.innerHTML = html;
    },
  
    // Открыть модальное окно фильма
    openFilmModal: async (filmId) => {
      const modal = document.getElementById('movieModal');
      modal.classList.add('active');
      
      // Сброс
      document.getElementById('modalTitle').textContent = "ЗАГРУЗКА...";
      document.getElementById('modalDesc').textContent = "Поиск данных...";
      document.getElementById('modalPoster').src = ""; 
      document.getElementById('modalRating').textContent = "-";
      
      // Скрываем плеер и сбрасываем кнопку
      const player = document.getElementById('modalPlayer');
      player.src = "";
      player.style.display = 'none';
      
      const oldMsg = document.getElementById('videoControls');
      if(oldMsg) oldMsg.remove();
      
      const playerWrapper = document.querySelector('.player-wrapper');
      
      try {
        // ЗАПРОС 1: Информация о фильме
        const urlInfo = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${filmId}`;
        const responseInfo = await fetch(urlInfo, {
          method: 'GET',
          headers: { 
            'X-API-KEY': kinopoiskAPI.key, 
            'Content-Type': 'application/json' 
          },
        });
        const data = await responseInfo.json();
        
        const name = data.nameRu || data.nameEn || data.nameOriginal;
        const genres = data.genres ? data.genres.map(g => g.genre).join(', ') : '-';
        
        document.getElementById('modalTitle').textContent = name;
        document.getElementById('modalYear').textContent = `ГОД: ${data.year || '-'} | ЖАНР: ${genres}`;
        document.getElementById('modalRating').textContent = data.ratingKinopoisk || data.ratingImdb || "-";
        document.getElementById('modalDesc').textContent = data.description || "Описание отсутствует.";
        document.getElementById('modalPoster').src = data.posterUrl;
  
        // СОХРАНЯЕМ В ИСТОРИЮ
        if (window.historyManager) {
          window.historyManager.addToHistory({
            filmId: filmId,
            title: name,
            year: data.year,
            rating: data.ratingKinopoisk || data.ratingImdb || null,
            poster: data.posterUrl
          });
        }
  
        // ЗАПРОС 2: Видео
        const urlVideo = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${filmId}/videos`;
        const responseVideo = await fetch(urlVideo, {
          method: 'GET',
          headers: { 
            'X-API-KEY': kinopoiskAPI.key, 
            'Content-Type': 'application/json' 
          },
        });
        const dataVideo = await responseVideo.json();
        
        let finalUrl = "";
        
        // Ищем YouTube трейлер
        if (dataVideo.items && dataVideo.items.length > 0) {
          const youtubeVideo = dataVideo.items.find(v => v.site === 'YOUTUBE' && v.url.includes('watch?v='));
          if (youtubeVideo) {
            const videoId = youtubeVideo.url.split('v=')[1].split('&')[0];
            finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
          }
        }
        
        // Запасной вариант: поиск по названию
        if (!finalUrl) {
          finalUrl = `https://www.youtube.com/embed?listType=search&list=trailer+${encodeURIComponent(name)}&autoplay=1`;
        }
        
        // Создаём кнопку "СМОТРЕТЬ"
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
            СМОТРЕТЬ
          </button>
        `;
        
        playerWrapper.appendChild(controls);
        
      } catch (error) {
        console.error(error);
        document.getElementById('modalTitle').textContent = "ERROR";
      }
    },
  
    // Запустить видео
    playVideo: (url) => {
      const player = document.getElementById('modalPlayer');
      const controls = document.getElementById('videoControls');
      
      player.src = url;
      player.style.display = 'block';
      
      if(controls) controls.remove();
    },
  
    // Закрыть модалку
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