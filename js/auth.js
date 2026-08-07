import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBeo-6vCIPmQPQGImh37OlkB7hqz-4u2K4",
  authDomain: "gom3utv-a7360.firebaseapp.com",
  projectId: "gom3utv-a7360",
  storageBucket: "gom3utv-a7360.firebasestorage.app",
  messagingSenderId: "953660316170",
  appId: "1:953660316170:web:6ec79baef7ab3dbaff1df3",
  measurementId: "G-YMBPE3ZPD9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Check current user status
onAuthStateChanged(auth, (user) => {
  const isLoginPage = window.location.pathname.includes("login.html");
  if (!user && !isLoginPage) {
    window.location.href = "login.html";
  } else if (user && isLoginPage) {
    window.location.href = "index.html";
  }
});

// Login Handler
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("adminEmail")?.value || document.getElementById("email")?.value;
    const password = document.getElementById("adminPassword")?.value || document.getElementById("password")?.value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login Successful!");
      window.location.href = "index.html";
    } catch (error) {
      alert("Login Failed: " + error.message);
    }
  });
}

// Logout Handler
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    });
  });
}
