import { t } from './lang.js';

export const kinopoiskAPI = {
  key: '97902904-1707-4ced-9ece-d2c5a54c9421',

  searchByKeyword: async (query) => {
    const url = `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}`;
    const resultContainer = document.getElementById('apiResult');

    if (resultContainer) {
      resultContainer.innerHTML = `<div class="status">${t('search.scanning')}</div>`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': kinopoiskAPI.key,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      kinopoiskAPI.renderSearchResults(data);
    } catch (error) {
      console.error(error);
      if (resultContainer) {
        resultContainer.innerHTML = `<div class="status" style="color:red">${t('movie.errorLoading')}: ${error.message}</div>`;
      }
    }
  },

  renderSearchResults: (data) => {
    const container = document.getElementById('apiResult');
    if (!container) return;

    if (!data.films || data.films.length === 0) {
      container.innerHTML = `<div class="status">${t('search.noMatches')}</div>`;
      return;
    }

    let html = `<div class="status" style="margin-bottom:10px;">${t('search.found')}: ${data.films.length} ${t('search.objects')}</div>`;

    data.films.forEach(film => {
      const year = film.year || t('common.na');
      const rating = film.rating && film.rating !== 'null' ? film.rating : '-';
      const title = film.nameRu || film.nameEn || t('movie.unnamed');
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

  loadCatalog: async () => {
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;

    grid.innerHTML = `<div class="status">${t('catalog.loading')}</div>`;

    try {
      const url = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/collections?type=TOP_250_MOVIES&page=1';
      const response = await fetch(url, {
        headers: { 'X-API-KEY': kinopoiskAPI.key }
      });
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        grid.innerHTML = `<div class="status">${t('catalog.empty')}</div>`;
        return;
      }

      grid.innerHTML = data.items.map(film => {
        const title = film.nameRu || film.nameEn || t('catalog.unnamed');
        const year = film.year || t('common.yearFallback');
        const rating = film.ratingKinopoisk || film.ratingImdb || t('common.ratingFallback');
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
      grid.innerHTML = `<div class="status" style="color:red">${t('movie.errorLoading')}: ${error.message}</div>`;
    }
  },

  openFilmModal: async (filmId) => {
    const modal = document.getElementById('movieModal');
    if (!modal) return;

    modal.classList.add('active');

    document.getElementById('modalTitle').textContent = t('movie.loading');
    document.getElementById('modalDesc').textContent = t('movie.searchingData');
    document.getElementById('modalPoster').src = '';
    document.getElementById('modalRating').textContent = '-';
    document.getElementById('modalYear').textContent = '';

    const player = document.getElementById('modalPlayer');
    player.src = '';
    player.style.display = 'none';

    const oldMsg = document.getElementById('videoControls');
    if (oldMsg) oldMsg.remove();

    const seasonsContainer = document.getElementById('seasonsContainer');
    const factsContainer = document.getElementById('factsContainer');
    const similarsContainer = document.getElementById('similarsContainer');

    if (seasonsContainer) seasonsContainer.innerHTML = '';
    if (factsContainer) factsContainer.innerHTML = '';
    if (similarsContainer) similarsContainer.innerHTML = '';

    try {
      const urlInfo = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${filmId}`;
      const responseInfo = await fetch(urlInfo, {
        headers: { 'X-API-KEY': kinopoiskAPI.key }
      });
      const data = await responseInfo.json();

      const name = data.nameRu || data.nameEn || data.nameOriginal || t('movie.unnamed');
      const genres = data.genres ? data.genres.map(g => g.genre).join(', ') : '-';
      const countries = data.countries ? data.countries.map(c => c.country).join(', ') : '-';

      document.getElementById('modalTitle').textContent = name;
      document.getElementById('modalYear').textContent = `${data.year || '—'} | ${genres} | ${countries}`;
      document.getElementById('modalRating').textContent = data.ratingKinopoisk || data.ratingImdb || '-';
      document.getElementById('modalDesc').textContent = data.description || t('movie.noDescription');
      document.getElementById('modalPoster').src = data.posterUrl || '';

      if (window.historyManager) {
        window.historyManager.addToHistory({
          filmId,
          title: name,
          year: data.year,
          rating: data.ratingKinopoisk || data.ratingImdb || null,
          poster: data.posterUrl
        });
      }

      const urlVideo = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${filmId}/videos`;
      const responseVideo = await fetch(urlVideo, {
        headers: { 'X-API-KEY': kinopoiskAPI.key }
      });
      const dataVideo = await responseVideo.json();

      let finalUrl = '';

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
      controls.className = 'video-controls';

      controls.innerHTML = `
        <div class="video-controls__status">${t('movie.mediaReady')}</div>
        <button class="btn-primary video-controls__button" onclick="kinopoiskAPI.playVideo('${finalUrl}')">
          ${t('movie.watchTrailer')}
        </button>
      `;

      playerWrapper.appendChild(controls);

      if (data.serial) kinopoiskAPI.loadSeasons(filmId);
      kinopoiskAPI.loadFacts(filmId);
      kinopoiskAPI.loadSimilars(filmId);
    } catch (error) {
      console.error(error);
      document.getElementById('modalTitle').textContent = t('movie.errorLoading');
      document.getElementById('modalDesc').textContent = error.message;
    }
  },

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
        container.innerHTML = `<div class="info-block-empty">${t('movie.noSeasons')}</div>`;
        return;
      }

      let html = `<div class="info-block-title">${t('movie.seasons')}</div>`;

      data.items.forEach(season => {
        html += `
          <div class="season-item">
            <div class="season-number">${t('movie.season')} ${season.number}</div>
            <div class="season-episodes">${season.episodes.length} ${t('movie.episodes')}</div>
          </div>
        `;
      });

      container.innerHTML = html;
    } catch (error) {
      console.error('Ошибка загрузки сезонов:', error);
    }
  },

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
        container.innerHTML = `<div class="info-block-empty">${t('movie.noFacts')}</div>`;
        return;
      }

      let html = `<div class="info-block-title">${t('movie.facts')}</div>`;

      data.items.slice(0, 5).forEach(fact => {
        const cleanText = fact.text.replace(/<\/?[^>]+(>|$)/g, '');
        html += `<div class="fact-item">${cleanText}</div>`;
      });

      container.innerHTML = html;
    } catch (error) {
      console.error('Ошибка загрузки фактов:', error);
    }
  },

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
        container.innerHTML = `<div class="info-block-empty">${t('movie.noSimilars')}</div>`;
        return;
      }

      let html = `<div class="info-block-title">${t('movie.similars')}</div><div class="similars-grid">`;

      data.items.slice(0, 6).forEach(film => {
        const title = film.nameRu || film.nameEn || t('movie.unnamed');
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

  playVideo: (url) => {
    const player = document.getElementById('modalPlayer');
    const controls = document.getElementById('videoControls');

    player.src = url;
    player.style.display = 'block';

    if (controls) controls.remove();
  },

  closeModal: () => {
    const modal = document.getElementById('movieModal');
    if (!modal) return;

    modal.classList.remove('active');

    setTimeout(() => {
      const player = document.getElementById('modalPlayer');
      if (player) player.src = '';

      const controls = document.getElementById('videoControls');
      if (controls) controls.remove();
    }, 300);
  }
};