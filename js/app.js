import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('playlistsGrid');
    const loader = document.getElementById('homeLoader');

    try {
        const q = query(collection(db, 'playlists'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        if (loader) loader.style.display = 'none';

        if (querySnapshot.empty) {
            if (grid) grid.innerHTML = '<p>No playlists available.</p>';
            return;
        }

        let html = '';
        querySnapshot.forEach((docSnap) => {
            const item = docSnap.data();
            if (item.status !== "disabled") {
                html += `
                    <div style="border: 1px solid #e2e8f0; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; background: #fff;">
                        <img src="${item.thumbnailUrl || 'https://via.placeholder.com/150'}" width="100%" style="border-radius:6px; max-height:180px; object-fit:cover;">
                        <h3 style="margin: 0.5rem 0;">${item.title || 'Untitled'}</h3>
                        <a href="${item.step1Url || '#'}" target="_blank" style="display:inline-block; padding:8px 16px; background:#2563eb; color:#fff; text-decoration:none; border-radius:4px;">Get Playlist</a>
                    </div>
                `;
            }
        });

        if (grid) grid.innerHTML = html;

    } catch (error) {
        if (loader) loader.style.display = 'none';
        console.error("Home Load Error:", error);
    }
});
