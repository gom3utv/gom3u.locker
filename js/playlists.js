/**
 * GoM3U TV - Admin Playlists Controller
 * Handles Firestore CRUD operations for Playlists.
 */

import { db } from './firebase-config.js';
import { logoutAdmin } from './auth.js';
import { 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Selectors
const DOM = {
    logoutBtn: document.getElementById('logoutBtn'),
    playlistsTableBody: document.getElementById('playlistsTableBody'),
    tableLoader: document.getElementById('tableLoader'),
    tableEmptyState: document.getElementById('tableEmptyState'),
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    playlistModal: document.getElementById('playlistModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    playlistForm: document.getElementById('playlistForm'),
    modalTitle: document.getElementById('modalTitle'),
    adminAlert: document.getElementById('adminAlert'),
    
    // Form Inputs
    playlistId: document.getElementById('playlistId'),
    title: document.getElementById('title'),
    description: document.getElementById('description'),
    playlistUrl: document.getElementById('playlistUrl'),
    status: document.getElementById('status'),
    step1Url: document.getElementById('step1Url'),
    step2Url: document.getElementById('step2Url'),
    tempThumbnailUrl: document.getElementById('tempThumbnailUrl'),
    savePlaylistBtn: document.getElementById('savePlaylistBtn'),
    saveBtnText: document.getElementById('saveBtnText'),
    saveSpinner: document.getElementById('saveSpinner')
};

// Initialize Controller
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    loadPlaylists();
});

function initEvents() {
    if (DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', logoutAdmin);
    }

    if (DOM.openAddModalBtn) {
        DOM.openAddModalBtn.addEventListener('click', () => openModal());
    }

    if (DOM.closeModalBtn) DOM.closeModalBtn.addEventListener('click', closeModal);
    if (DOM.cancelModalBtn) DOM.cancelModalBtn.addEventListener('click', closeModal);

    if (DOM.playlistForm) {
        DOM.playlistForm.addEventListener('submit', handleSavePlaylist);
    }
}

/**
 * Loads all Playlists from Firestore
 */
async function loadPlaylists() {
    showTableLoading(true);
    hideAlert();

    try {
        const q = query(collection(db, 'playlists'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const playlists = [];

        querySnapshot.forEach((docSnap) => {
            playlists.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        renderPlaylistsTable(playlists);
    } catch (error) {
        console.error("Error loading playlists:", error);
        showAlert("Failed to load playlists from server.", "danger");
    } finally {
        showTableLoading(false);
    }
}

/**
 * Renders the Playlists Table Data
 */
function renderPlaylistsTable(playlists) {
    if (!playlists || playlists.length === 0) {
        DOM.playlistsTableBody.innerHTML = '';
        DOM.tableEmptyState.style.display = 'block';
        return;
    }

    DOM.tableEmptyState.style.display = 'none';
    
    const rowsHtml = playlists.map(p => {
        const formattedDate = formatDate(p.createdAt);
        const thumbUrl = p.thumbnailUrl || '../assets/placeholder.jpg';
        const isStatusActive = p.status === 'active';
        const unlocks = p.unlockCount || 0;

        return `
            <tr>
                <td>
                    <img src="${escapeHtml(thumbUrl)}" alt="Thumb" class="table-thumb" onerror="this.src='../assets/placeholder.jpg';">
                </td>
                <td>
                    <strong>${escapeHtml(p.title)}</strong>
                    <div class="text-muted small">${escapeHtml(p.description.substring(0, 50))}...</div>
                </td>
                <td>
                    <span class="badge ${isStatusActive ? 'badge-success' : 'badge-secondary'}">
                        ${isStatusActive ? 'Active' : 'Disabled'}
                    </span>
                </td>
                <td>${formattedDate}</td>
                <td><strong>${unlocks}</strong></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${p.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${p.id}" data-title="${escapeHtml(p.title)}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    DOM.playlistsTableBody.innerHTML = rowsHtml;

    // Attach Event Listeners to Edit/Delete Buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openModalForEdit(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleDeletePlaylist(e.target.dataset.id, e.target.dataset.title));
    });
}

/**
 * Opens Modal for Adding New Playlist
 */
function openModal() {
    DOM.playlistForm.reset();
    DOM.playlistId.value = '';
    DOM.modalTitle.textContent = "Add New Playlist";
    DOM.playlistModal.style.display = 'flex';
}

/**
 * Opens Modal for Editing Existing Playlist
 */
async function openModalForEdit(id) {
    try {
        const docRef = doc(db, 'playlists', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            showAlert("Playlist not found.", "danger");
            return;
        }

        const data = docSnap.data();

        DOM.playlistId.value = id;
        DOM.title.value = data.title || '';
        DOM.description.value = data.description || '';
        DOM.playlistUrl.value = data.playlistUrl || '';
        DOM.status.value = data.status || 'active';
        DOM.step1Url.value = data.step1Url || '';
        DOM.step2Url.value = data.step2Url || '';
        DOM.tempThumbnailUrl.value = data.thumbnailUrl || '';

        DOM.modalTitle.textContent = "Edit Playlist";
        DOM.playlistModal.style.display = 'flex';

    } catch (error) {
        console.error("Error fetching playlist detail:", error);
        showAlert("Failed to fetch playlist details.", "danger");
    }
}

/**
 * Closes Modal
 */
function closeModal() {
    DOM.playlistModal.style.display = 'none';
}

/**
 * Handles Form Submission (Create or Update)
 */
async function handleSavePlaylist(e) {
    e.preventDefault();

    const id = DOM.playlistId.value.trim();
    const title = DOM.title.value.trim();
    const description = DOM.description.value.trim();
    const playlistUrl = DOM.playlistUrl.value.trim();
    const status = DOM.status.value;
    const step1Url = DOM.step1Url.value.trim();
    const step2Url = DOM.step2Url.value.trim();
    const thumbnailUrl = DOM.tempThumbnailUrl.value.trim() || '../assets/placeholder.jpg';

    if (!title || !description || !playlistUrl) {
        alert("Please fill in all required fields.");
        return;
    }

    setSaveLoading(true);

    try {
        const playlistData = {
            title,
            description,
            playlistUrl,
            status,
            step1Url,
            step2Url,
            thumbnailUrl,
            updatedAt: serverTimestamp()
        };

        if (id) {
            // Update Existing Playlist
            const docRef = doc(db, 'playlists', id);
            await updateDoc(docRef, playlistData);
            showAlert("Playlist updated successfully!", "success");
        } else {
            // Add New Playlist
            playlistData.createdAt = serverTimestamp();
            playlistData.unlockCount = 0;
            await addDoc(collection(db, 'playlists'), playlistData);
            showAlert("New playlist created successfully!", "success");
        }

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
 * Handles Delete Playlist with Confirmation
 */
async function handleDeletePlaylist(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
        return;
    }

    try {
        await deleteDoc(doc(db, 'playlists', id));
        showAlert(`Playlist "${title}" deleted successfully.`, "success");
        loadPlaylists();
    } catch (error) {
        console.error("Error deleting playlist:", error);
        showAlert("Failed to delete playlist.", "danger");
    }
}

/**
 * UI Utilities
 */
function showTableLoading(isLoading) {
    DOM.tableLoader.style.display = isLoading ? 'block' : 'none';
}

function setSaveLoading(isLoading) {
    DOM.savePlaylistBtn.disabled = isLoading;
    DOM.saveBtnText.style.display = isLoading ? 'none' : 'inline';
    DOM.saveSpinner.style.display = isLoading ? 'inline-block' : 'none';
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