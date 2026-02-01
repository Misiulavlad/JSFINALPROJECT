// auth_logic.js
import { auth } from "./firebase"; // Импорт нашего экземпляра auth
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";

// --- РЕГИСТРАЦИЯ ---
const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Пользователь зарегистрирован:", user);
    // Здесь можно перенаправить пользователя на главную страницу
  } catch (error) {
    console.error("Ошибка регистрации:", error.code, error.message);
    alert("Ошибка: " + error.message);
  }
};

// --- ВХОД (ЛОГИН) ---
const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Пользователь вошел:", user);
  } catch (error) {
    console.error("Ошибка входа:", error.code, error.message);
    alert("Неверный логин или пароль");
  }
};

// --- ВЫХОД ---
const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("Пользователь вышел");
  } catch (error) {
    console.error("Ошибка при выходе:", error);
  }
};