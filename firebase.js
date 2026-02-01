// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Добавляем импорт Auth
import { getAuth } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyDEglvVZgdOR4hG9ooe8JQaI-Uwfh0BKXw",
  authDomain: "cybercinema.firebaseapp.com",
  projectId: "cybercinema",
  storageBucket: "cybercinema.firebasestorage.app",
  messagingSenderId: "687796778343",
  appId: "1:687796778343:web:b59402c122b32605126bc2",
  measurementId: "G-ZZMG4VK7VE"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Инициализация Auth
export const auth = getAuth(app);

// Экспортируем app по дефолту (на всякий случай)
export default app;