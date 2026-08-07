/**
 * GoM3U TV - Statistics Controller
 * Displays ranked list of all playlists by total unlocks
 */

import { db } from './firebase-config.js';
import { logoutAdmin } from './auth.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const DOM = {
    logoutBtn: document.getElementById('logoutBtn'),
    statsTableBody: document.getElementById('statsTableBody'),
    statsLoader: document.getElementById('statsLoader')
};

document.addEventListener('DOMContentLoaded', () => {
    if (DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', logoutAdmin);
    }
    loadFullStatistics();
});

async function loadFullStatistics() {
    try {
        const querySnapshot = await getDocs(collection(db, 'playlists'));
        const playlists = [];

        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            playlists.push({
                id: docSnap.id,
                ...data,
                unlockCount: data.unlockCount || 0
            });
        });

        // Sort descending by unlocks
        playlists.sort((a, b) => b.unlockCount - a.unlockCount);
        renderStatsTable(playlists);

    } catch (error) {
        console.error("Error loading statistics:", error);
    } finally {
        if (DOM.statsLoader) DOM.statsLoader.style.display = 'none';
    }
}

function renderStatsTable(items) {
    if (!DOM.statsTableBody) return;

    if (items.length === 0) {
        DOM.statsTableBody.innerHTML = `<tr><td colspan="5" class="text-center">No playlists found.</td></tr>`;
        return;
    }

    DOM.statsTableBody.innerHTML = items.map((p, index) => `
        <tr>
            <td><strong>#${index + 1}</strong></td>
            <td>
                <img src="${p.thumbnailUrl || '../assets/placeholder.jpg'}" alt="Thumb" class="table-thumb" onerror="this.src='../assets/placeholder.jpg'">
            </td>
            <td><strong>${escapeHtml(p.title || 'Untitled')}</strong></td>
            <td>
                <span class="badge ${p.status === 'active' ? 'badge-success' : 'badge-disabled'}">
                    ${p.status || 'active'}
                </span>
            </td>
            <td><strong class="text-primary">${p.unlockCount.toLocaleString()}</strong></td>
        </tr>
    `).join('');
}

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}