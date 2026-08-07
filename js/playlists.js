import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    updateDoc, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// DOM Elements
const DOM = {
    tableBody: document.getElementById("playlistsTableBody"),
    tableLoader: document.getElementById("dashLoader"),
    playlistForm: document.getElementById("playlistForm"),
    savePlaylistBtn: document.getElementById("savePlaylistBtn"),
    saveBtnText: document.getElementById("saveBtnText"),
    saveSpinner: document.getElementById("saveSpinner"),
    adminAlert: document.getElementById("adminAlert")
};

// Application Load
document.addEventListener("DOMContentLoaded", () => {
    loadPlaylists();

    if (DOM.playlistForm) {
        DOM.playlistForm.addEventListener("submit", handleSavePlaylist);
    }
});

/**
 * Fetch and display all playlists
 */
async function loadPlaylists() {
    if (!DOM.tableBody) return;
    showTableLoading(true);

    try {
        const q = query(collection(db, "playlists"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        showTableLoading(false);

        if (querySnapshot.empty) {
            DOM.tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No playlists found.</td></tr>`;
            return;
        }

        let rowsHtml = "";
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            const formattedDate = formatDate(data.createdAt);
            const statusBadge = data.status === "disabled" 
                ? `<span style="background:#fee2e2; color:#991b1b; padding:3px 8px; border-radius:12px; font-size:12px;">Disabled</span>`
                : `<span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:12px; font-size:12px;">Active</span>`;

            rowsHtml += `
                <tr>
                    <td>
                        <img src="${escapeHtml(data.thumbnailUrl || 'https://via.placeholder.com/40')}" 
                             width="40" height="40" 
                             style="border-radius:6px; object-fit:cover;"
                             onerror="this.src='https://via.placeholder.com/40';">
                    </td>
                    <td><strong>${escapeHtml(data.title || 'Untitled')}</strong></td>
                    <td>${statusBadge}</td>
                    <td>${formattedDate}</td>
                    <td>
                        <button onclick="window.handleDeletePlaylist('${id}', '${escapeHtml(data.title)}')" 
                                style="background:#ef4444; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        DOM.tableBody.innerHTML = rowsHtml;

    } catch (error) {
        showTableLoading(false);
        console.error("Error loading playlists:", error);
        showAlert("Failed to load playlists.", "danger");
    }
}

/**
 * Handles Form Submission to Add/Update Playlist
 */
async function handleSavePlaylist(e) {
    e.preventDefault();

    const title = document.getElementById("title")?.value.trim() || "";
    const status = document.getElementById("status")?.value || "active";
    const step1Url = document.getElementById("step1Url")?.value.trim() || "";
    const step2Url = document.getElementById("step2Url")?.value.trim() || "";
    const thumbnailUrl = document.getElementById("thumbnailUrl")?.value.trim() || "";

    const playlistData = {
        title,
        status,
        step1Url,
        step2Url,
        thumbnailUrl: thumbnailUrl || "https://via.placeholder.com/150",
        updatedAt: serverTimestamp()
    };

    setSaveLoading(true);

    try {
        playlistData.createdAt = serverTimestamp();
        playlistData.unlockCount = 0;
        await addDoc(collection(db, "playlists"), playlistData);
        showAlert("New playlist created successfully!", "success");

        if (DOM.playlistForm) DOM.playlistForm.reset();
        closeModal();
        loadPlaylists();

    } catch (error) {
        console.error("Error saving playlist:", error);
        showAlert("Error saving playlist: " + error.message, "danger");
    } finally {
        setSaveLoading(false);
    }
}

/**
 * Handles Delete Playlist
 */
window.handleDeletePlaylist = async function(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, "playlists", id));
        showAlert(`Playlist "${title}" deleted successfully.`, "success");
        loadPlaylists();
    } catch (error) {
        console.error("Error deleting playlist:", error);
        showAlert("Failed to delete playlist.", "danger");
    }
};

// UI Utilities
function showTableLoading(isLoading) {
    if (DOM.tableLoader) DOM.tableLoader.style.display = isLoading ? 'block' : 'none';
}

function setSaveLoading(isLoading) {
    if (DOM.savePlaylistBtn) DOM.savePlaylistBtn.disabled = isLoading;
    if (DOM.saveBtnText) DOM.saveBtnText.style.display = isLoading ? 'none' : 'inline';
    if (DOM.saveSpinner) DOM.saveSpinner.style.display = isLoading ? 'inline-block' : 'none';
}

function showAlert(message, type = 'info') {
    if (DOM.adminAlert) {
        DOM.adminAlert.textContent = message;
        DOM.adminAlert.className = `alert alert-${type}`;
        DOM.adminAlert.style.display = 'block';
        setTimeout(hideAlert, 4000);
    }
}

function hideAlert() {
    if (DOM.adminAlert) DOM.adminAlert.style.display = 'none';
}

function closeModal() {
    const modal = document.getElementById("playlistModal") || document.querySelector(".modal");
    if (modal) modal.style.display = 'none';
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
