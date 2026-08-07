/**
 * GoM3U TV - Admin Dashboard Controller
 * Calculates Real-time Metrics and Top Unlocked Playlists
 */

import { db } from './firebase-config.js';
import { logoutAdmin } from './auth.js';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    limit 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const DOM = {
    logoutBtn: document.getElementById('logoutBtn'),
    totalPlaylistsCount: document.getElementById('totalPlaylistsCount'),
    activePlaylistsCount: document.getElementById('activePlaylistsCount'),
    disabledPlaylistsCount: document.getElementById('disabledPlaylistsCount'),
    totalUnlocksCount: document.getElementById('totalUnlocksCount'),
    topPlaylistsTableBody: document.getElementById('topPlaylistsTableBody'),
    dashLoader: document.getElementById('dashLoader')
};

document.addEventListener('DOMContentLoaded', () => {
    if (DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', logoutAdmin);
    }
    loadDashboardMetrics();
});

async function loadDashboardMetrics() {
    try {
        const playlistsRef = collection(db, 'playlists');
        const querySnapshot = await getDocs(playlistsRef);

        let total = 0;
        let active = 0;
        let disabled = 0;
        let unlocks = 0;
        const playlists = [];

        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            total++;
            if (data.status === 'active') active++;
            if (data.status === 'disabled') disabled++;
            
            const currentUnlocks = data.unlockCount || 0;
            unlocks += currentUnlocks;

            playlists.push({
                id: docSnap.id,
                ...data,
                unlockCount: currentUnlocks
            });
        });

        // Update Stat Cards
        DOM.totalPlaylistsCount.textContent = total;
        DOM.activePlaylistsCount.textContent = active;
        DOM.disabledPlaylistsCount.textContent = disabled;
        DOM.totalUnlocksCount.textContent = unlocks.toLocaleString();

        // Sort Top 5 Playlists by Unlocks
        playlists.sort((a, b) => b.unlockCount - a.unlockCount);
        const top5 = playlists.slice(0, 5);

        renderTopPlaylists(top5);

    } catch (error) {
        console.error("Error loading dashboard metrics:", error);
    } finally {
        if (DOM.dashLoader) DOM.dashLoader.style.display = 'none';
    }
}

function renderTopPlaylists(items) {
    if (!DOM.topPlaylistsTableBody) return;

    if (items.length === 0) {
        DOM.topPlaylistsTableBody.innerHTML = `<tr><td colspan="4" class="text-center">No playlists data available.</td></tr>`;
        return;
    }

    DOM.topPlaylistsTableBody.innerHTML = items.map(p => `
        <tr>
            <td>
                <img src="${p.thumbnailUrl || '../assets/placeholder.jpg'}" alt="Thumb" class="table-thumb" onerror="this.src='../assets/placeholder.jpg'">
            </td>
            <td><strong>${escapeHtml(p.title || 'Untitled')}</strong></td>
            <td>
                <span class="badge ${p.status === 'active' ? 'badge-success' : 'badge-disabled'}">
                    ${p.status || 'active'}
                </span>
            </td>
            <td><strong>${(p.unlockCount || 0).toLocaleString()}</strong></td>
        </tr>
    `).join('');
}

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}