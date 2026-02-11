const API_KEY = '97902904-1707-4ced-9ece-d2c5a54c9421';
const FILM_ID = '404900'; // ID сериала

const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${FILM_ID}/seasons`;

fetch(url, {
    method: 'GET',
    headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
    },
})
.then(response => {
    if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    return response.json();
})
.then(data => {
    console.log('Данные получены:', data);
    // Пример вывода первого сезона
    if (data.items && data.items.length > 0) {
        console.log('Эпизоды:', data.items[0].episodes);
    }
})
.catch(error => console.error('Ошибка:', error));