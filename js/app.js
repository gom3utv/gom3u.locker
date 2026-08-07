/**
 * GoM3U TV - Homepage Controller (Firebase Firestore Connected)
 * Fetches site settings and active playlists dynamically from Firestore.
 */

import { db, isFirebaseConfigured } from './firebase-config.js';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Element Selectors
const DOM = {
    navToggle: document.getElementById('navToggle'),
    mobileNav: document.getElementById('mobileNav'),
    announcementSection: document.getElementById('announcementSection'),
    announcementText: document.getElementById('announcementText'),
    playlistsGrid: document.getElementById('playlistsGrid'),
    mainLoader: document.getElementById('mainLoader'),
    emptyState: document.getElementById('emptyState'),
    telegramLink: document.getElementById('telegramLink'),
    mobileTelegramLink: document.getElementById('mobileTelegramLink'),
    footerText: document.getElementById('footerText')
};

// Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initApp();
});

/**
 * Handles Mobile Menu Toggle Logic
 */
function initNavigation() {
    if (!DOM.navToggle || !DOM.mobileNav) return;

    DOM.navToggle.addEventListener('click', () => {
        const isOpen = DOM.mobileNav.classList.toggle('is-open');
        DOM.navToggle.setAttribute('aria-expanded', isOpen);
        DOM.mobileNav.setAttribute('aria-hidden', !isOpen);
    });
}

/**
 * Main Application Async Entry Point
 */
async function initApp() {
    // 1. Check if user configured Firebase
    if (!isFirebaseConfigured()) {
        showConfigWarning();
        return;
    }

    // 2. Load Firestore Configurations & Playlists
    try {
        await Promise.all([
            fetchGlobalSettings(),
            fetchActivePlaylists()
        ]);
    } catch (error) {
        console.error("Initialization Error:", error);
        showErrorMessage("Unable to load data. Please try again later.");
    }
}

/**
 * Fetches Site & Announcement Settings from Firestore ('settings/site' and 'settings/announcement')
 */
async function fetchGlobalSettings() {
    try {
        // Fetch Site Config
        const siteDocRef = doc(db, 'settings', 'site');
        const siteSnap = await getDoc(siteDocRef);

        if (siteSnap.exists()) {
            const siteData = siteSnap.data();
            if (siteData.telegramUrl) {
                if (DOM.telegramLink) DOM.telegramLink.href = siteData.telegramUrl;
                if (DOM.mobileTelegramLink) DOM.mobileTelegramLink.href = siteData.telegramUrl;
            }
            if (siteData.footerText && DOM.footerText) {
                DOM.footerText.innerHTML = escapeHtml(siteData.footerText);
            }
        }

        // Fetch Announcement Config
        const announceDocRef = doc(db, 'settings', 'announcement');
        const announceSnap = await getDoc(announceDocRef);

        if (announceSnap.exists()) {
            const announceData = announceSnap.data();
            if (announceData.enabled && announceData.text) {
                if (DOM.announcementText) DOM.announcementText.textContent = announceData.text;
                if (DOM.announcementSection) DOM.announcementSection.style.display = 'block';
            } else {
                if (DOM.announcementSection) DOM.announcementSection.style.display = 'none';
            }
        }
    } catch (error) {
        console.warn("Could not fetch site settings from Firestore:", error);
    }
}

/**
 * Fetches Only 'Active' Playlists Sorted by Newest First from Firestore
 */
async function fetchActivePlaylists() {
    try {
        // Firestore Query: playlists collection where status == 'active', sorted by createdAt desc
        const playlistsRef = collection(db, 'playlists');
        const q = query(
            playlistsRef, 
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const playlists = [];

        querySnapshot.forEach((docSnap) => {
            playlists.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        renderPlaylists(playlists);

    } catch (error) {
        console.error("Firestore Playlists Fetch Error:", error);
        showErrorMessage("Unable to load playlists from server.");
    }
}

/**
 * Renders Playlist Cards into HTML Grid
 * @param {Array} playlists 
 */
function renderPlaylists(playlists) {
    if (DOM.mainLoader) DOM.mainLoader.style.display = 'none';

    if (!playlists || playlists.length === 0) {
        if (DOM.emptyState) DOM.emptyState.style.display = 'block';
        if (DOM.playlistsGrid) DOM.playlistsGrid.innerHTML = '';
        return;
    }

    if (DOM.emptyState) DOM.emptyState.style.display = 'none';

    const cardsHtml = playlists.map(playlist => createCardElement(playlist)).join('');
    if (DOM.playlistsGrid) DOM.playlistsGrid.innerHTML = cardsHtml;
}

/**
 * Creates HTML Template for a Playlist Card
 * @param {Object} playlist 
 * @returns {string}
 */
function createCardElement(playlist) {
    const formattedDate = formatDate(playlist.createdAt);
    const thumbUrl = playlist.thumbnailUrl || 'assets/placeholder.jpg';

    return `
        <article class="card">
            <div class="card-thumbnail-wrapper">
                <img src="${escapeHtml(thumbUrl)}" 
                     alt="${escapeHtml(playlist.title)}" 
                     class="card-thumbnail"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='assets/placeholder.jpg';">
            </div>
            <div class="card-body">
                <span class="card-date">${formattedDate}</span>
                <h2 class="card-title">${escapeHtml(playlist.title)}</h2>
                <p class="card-description">${escapeHtml(playlist.description)}</p>
                <div class="card-footer">
                    <a href="locker.html?id=${encodeURIComponent(playlist.id)}" class="btn btn-primary">
                        GET PLAYLIST LINKS
                    </a>
                </div>
            </div>
        </article>
    `;
}

/**
 * Helper: Shows warning on page if Firebase configuration is missing
 */
function showConfigWarning() {
    if (DOM.mainLoader) DOM.mainLoader.style.display = 'none';
    if (DOM.playlistsGrid) {
        DOM.playlistsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚙️</div>
                <h3>Firebase Config Required</h3>
                <p>Please update <code>js/firebase-config.js</code> with your actual Firebase API credentials.</p>
            </div>
        `;
    }
}

/**
 * Helper: Shows user-friendly error state
 * @param {string} msg 
 */
function showErrorMessage(msg) {
    if (DOM.mainLoader) DOM.mainLoader.style.display = 'none';
    if (DOM.playlistsGrid) {
        DOM.playlistsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
                <h3>Error Loading Data</h3>
                <p>${escapeHtml(msg)}</p>
            </div>
        `;
    }
}

/**
 * Utility: Converts Firebase Timestamp or ISO String to human readable date
 */
function formatDate(timestamp) {
    if (!timestamp) return 'RECENT';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else {
        date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return 'RECENT';

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).toUpperCase();
}

/**
 * Utility: Sanitizes strings against XSS attacks
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
