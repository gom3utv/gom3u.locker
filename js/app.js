import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ১. ফায়ারবেস কানেকশন সেটআপ (Firebase Config)
const firebaseConfig = {
  apiKey: "AIzaSyBeo-6vCIPmQPQGImh37OlkB7hqz-4u2K4",
  authDomain: "gom3utv-a7360.firebaseapp.com",
  projectId: "gom3utv-a7360",
  storageBucket: "gom3utv-a7360.firebasestorage.app",
  messagingSenderId: "953660316170",
  appId: "1:953660316170:web:6ec79baef7ab3dbaff1df3",
  measurementId: "G-YMBPE3ZPD9"
};

// ২. ফায়ারবেস চালু করা
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Selectors
const DOM = {
    playlistsGrid: document.getElementById('playlistsGrid'),
    mainLoader: document.getElementById('homeLoader'),
    announcementSection: document.getElementById('noticeBannerContainer')
};

// পেজ লোড হলে কাজ শুরু
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    try {
        await Promise.all([
            fetchGlobalSettings(),
            fetchActivePlaylists()
        ]);
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

// সাইটের নোটিশ এবং অন্যান্য সেটিংস লোড
async function fetchGlobalSettings() {
    try {
        const announceDocRef = doc(db, 'settings', 'announcement');
        const announceSnap = await getDoc(announceDocRef);

        if (announceSnap.exists()) {
            const announceData = announceSnap.data();
            if (announceData.enabled && announceData.text && DOM.announcementSection) {
                DOM.announcementSection.innerHTML = `
                    <div class="notice-banner">
                        <p>${escapeHtml(announceData.text)}</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.warn("Notice fetch failed:", error);
    }
}

// ফায়ারবেস থেকে সক্রিয় প্লেলিস্ট লোড
async function fetchActivePlaylists() {
    try {
        const playlistsRef = collection(db, 'playlists');
        const q = query(playlistsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        if (DOM.mainLoader) DOM.mainLoader.style.display = 'none';

        if (querySnapshot.empty) {
            if (DOM.playlistsGrid) {
                DOM.playlistsGrid.innerHTML = `
                    <div class="empty-state">
                        <p>No active playlists available right now.</p>
                    </div>
                `;
            }
            return;
        }

        let cardsHtml = '';
        querySnapshot.forEach((docSnap) => {
            const playlist = docSnap.data();
            const id = docSnap.id;
            cardsHtml += createCardElement(id, playlist);
        });

        if (DOM.playlistsGrid) DOM.playlistsGrid.innerHTML = cardsHtml;

    } catch (error) {
        console.error("Playlists Fetch Error:", error);
        if (DOM.mainLoader) DOM.mainLoader.style.display = 'none';
        if (DOM.playlistsGrid) {
            DOM.playlistsGrid.innerHTML = `
                <div class="empty-state">
                    <p>Unable to load playlists. Please try again later.</p>
                </div>
            `;
        }
    }
}

// প্লেলিস্ট কার্ডের ডিজাইন তৈরি
function createCardElement(id, playlist) {
    const thumbUrl = playlist.thumbnail || 'https://via.placeholder.com/300x160?text=IPTV+Playlist';
    const title = playlist.title || 'Untitled Playlist';
    const description = playlist.description || 'No description provided.';
    const link = playlist.m3uUrl || '#';

    return `
        <article class="playlist-card">
            <div class="card-thumb-wrap">
                <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(title)}" class="card-thumb" loading="lazy">
            </div>
            <div class="card-body">
                <h3 class="card-title">${escapeHtml(title)}</h3>
                <p class="card-desc">${escapeHtml(description)}</p>
                <div class="card-footer">
                    <a href="${escapeHtml(link)}" target="_blank" class="btn btn-primary btn-sm">GET PLAYLIST LINK</a>
                </div>
            </div>
        </article>
    `;
}

// নিরাপত্তা বজায় রাখতে বিশেষ টেক্সট এস্কেপ
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
