import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeo-6vCIPmQPQGImh37OlkB7hqz-4u2K4",
  authDomain: "gom3utv-a7360.firebaseapp.com",
  projectId: "gom3utv-a7360",
  storageBucket: "gom3utv-a7360.firebasestorage.app",
  messagingSenderId: "953660316170",
  appId: "1:953660316170:web:6ec79baef7ab3dbaff1df3",
  measurementId: "G-YMBPE3ZPD9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const playlistForm = document.getElementById("playlistForm");
const logoutBtn = document.getElementById("logoutBtn");
const adminPlaylistsList = document.getElementById("adminPlaylistsList");

// Auth State Check
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (loginSection) loginSection.style.display = "none";
    if (dashboardSection) dashboardSection.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    loadAdminPlaylists();
  } else {
    if (loginSection) loginSection.style.display = "block";
    if (dashboardSection) dashboardSection.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});

// Admin Login Logic
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();
    const loginBtn = document.getElementById("loginBtn");

    try {
      if (loginBtn) loginBtn.innerText = "Logging in...";
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login Successful!");
    } catch (error) {
      alert("Login Error: " + error.message);
    } finally {
      if (loginBtn) loginBtn.innerText = "Login";
    }
  });
}

// Admin Logout Logic
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    alert("Logged out!");
  });
}

// Add Playlist Logic
if (playlistForm) {
  playlistForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const m3uUrl = document.getElementById("m3uUrl").value;
    const thumbnail = document.getElementById("thumbnail").value;
    const description = document.getElementById("description").value;

    try {
      await addDoc(collection(db, "playlists"), {
        title,
        m3uUrl,
        thumbnail,
        description,
        createdAt: serverTimestamp()
      });
      alert("Playlist added successfully!");
      playlistForm.reset();
      loadAdminPlaylists();
    } catch (error) {
      alert("Error adding playlist: " + error.message);
    }
  });
}

// Load Playlists
async function loadAdminPlaylists() {
  if (!adminPlaylistsList) return;
  adminPlaylistsList.innerHTML = "<p>Loading playlists...</p>";

  try {
    const q = query(collection(db, "playlists"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      adminPlaylistsList.innerHTML = "<p>No playlists found.</p>";
      return;
    }

    let html = "";
    querySnapshot.forEach((docSnap) => {
      const item = docSnap.data();
      html += `
        <div class="playlist-item">
          <div>
            <strong>${item.title}</strong>
            <p style="margin:4px 0; font-size:12px; color:#64748b;">${item.m3uUrl}</p>
          </div>
          <button onclick="window.deletePlaylist('${docSnap.id}')" style="background:#ef4444; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Delete</button>
        </div>
      `;
    });
    adminPlaylistsList.innerHTML = html;
  } catch (error) {
    adminPlaylistsList.innerHTML = "<p style='color:red;'>Failed to load: " + error.message + "</p>";
  }
}

// Delete Playlist
window.deletePlaylist = async (docId) => {
  if (confirm("Are you sure you want to delete this playlist?")) {
    try {
      await deleteDoc(doc(db, "playlists", docId));
      alert("Deleted successfully!");
      loadAdminPlaylists();
    } catch (error) {
      alert("Error deleting: " + error.message);
    }
  }
};
