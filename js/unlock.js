/**
 * GoM3U TV - Unlock Controller & Verification Logic
 * Manages URL Parameters, Multi-step verification timers, and Firestore Unlock Updates.
 */

import { db } from './firebase-config.js';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    increment 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const DOM = {
    unlockLoader: document.getElementById('unlockLoader'),
    unlockError: document.getElementById('unlockError'),
    unlockContent: document.getElementById('unlockContent'),
    
    // Playlist Info Header
    playlistThumb: document.getElementById('playlistThumb'),
    playlistTitle: document.getElementById('playlistTitle'),
    playlistDesc: document.getElementById('playlistDesc'),
    
    // Step Cards & Buttons
    step1Box: document.getElementById('step1Box'),
    step1Btn: document.getElementById('step1Btn'),
    step2Box: document.getElementById('step2Box'),
    step2Btn: document.getElementById('step2Btn'),
    
    // Timer
    timerContainer: document.getElementById('timerContainer'),
    timerCountdown: document.getElementById('timerCountdown'),
    timerProgressBar: document.getElementById('timerProgressBar'),
    
    // Result
    resultBox: document.getElementById('resultBox'),
    unlockedUrlInput: document.getElementById('unlockedUrlInput'),
    copyUrlBtn: document.getElementById('copyUrlBtn'),
    copyAlert: document.getElementById('copyAlert')
};

// Global State Variable
let currentPlaylist = null;
let globalSettings = null;
let step1Completed = false;
let step2Completed = false;
let isTimerRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    initUnlockPage();
});

/**
 * Parses Playlist ID from URL and loads data
 */
async function initUnlockPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const playlistId = urlParams.get('id');

    if (!playlistId) {
        showErrorState();
        return;
    }

    try {
        // Fetch Global Settings first (for fallback Step URLs & timer duration)
        await loadGlobalSettings();

        // Fetch Specific Playlist Details
        const playlistDocRef = doc(db, 'playlists', playlistId);
        const docSnap = await getDoc(playlistDocRef);

        if (!docSnap.exists() || docSnap.data().status !== 'active') {
            showErrorState();
            return;
        }

        currentPlaylist = { id: docSnap.id, ...docSnap.data() };
        renderPlaylistInfo(currentPlaylist);
        setupStepButtons();

    } catch (error) {
        console.error("Error loading unlock page:", error);
        showErrorState();
    } finally {
        DOM.unlockLoader.style.display = 'none';
    }
}

/**
 * Loads Global Settings from Firestore
 */
async function loadGlobalSettings() {
    try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
        if (settingsSnap.exists()) {
            globalSettings = settingsSnap.data();
        } else {
            globalSettings = {
                defaultStep1Url: 'https://google.com',
                defaultStep2Url: 'https://google.com',
                timerSeconds: 15
            };
        }
    } catch (e) {
        console.warn("Using default settings fallback", e);
        globalSettings = {
            defaultStep1Url: 'https://google.com',
            defaultStep2Url: 'https://google.com',
            timerSeconds: 15
        };
    }
}

/**
 * Displays Playlist Info on page
 */
function renderPlaylistInfo(p) {
    DOM.playlistTitle.textContent = p.title || 'Untitled Playlist';
    DOM.playlistDesc.textContent = p.description || '';
    DOM.playlistThumb.src = p.thumbnailUrl || 'assets/placeholder.jpg';
    DOM.playlistThumb.onerror = () => { DOM.playlistThumb.src = 'assets/placeholder.jpg'; };

    DOM.unlockContent.style.display = 'block';
}

/**
 * Sets up Step Button Click Events
 */
function setupStepButtons() {
    // Step 1 Click
    DOM.step1Btn.addEventListener('click', () => {
        if (isTimerRunning || step1Completed) return;

        const targetUrl = currentPlaylist.step1Url || globalSettings.defaultStep1Url;
        window.open(targetUrl, '_blank');

        startTimer(() => {
            step1Completed = true;
            DOM.step1Box.classList.remove('active');
            DOM.step1Box.classList.add('completed');
            DOM.step1Btn.disabled = true;
            DOM.step1Btn.querySelector('span').textContent = '✓ Step 1 Complete';

            // Enable Step 2
            DOM.step2Box.classList.remove('disabled');
            DOM.step2Box.classList.add('active');
            DOM.step2Btn.disabled = false;
            DOM.step2Btn.classList.remove('btn-secondary');
            DOM.step2Btn.classList.add('btn-primary');
            DOM.step2Btn.querySelector('span').textContent = 'Open Step 2 Link';
        });
    });

    // Step 2 Click
    DOM.step2Btn.addEventListener('click', () => {
        if (isTimerRunning || !step1Completed || step2Completed) return;

        const targetUrl = currentPlaylist.step2Url || globalSettings.defaultStep2Url;
        window.open(targetUrl, '_blank');

        startTimer(async () => {
            step2Completed = true;
            DOM.step2Box.classList.remove('active');
            DOM.step2Box.classList.add('completed');
            DOM.step2Btn.disabled = true;
            DOM.step2Btn.querySelector('span').textContent = '✓ Step 2 Complete';

            // Show Result
            revealDestinationUrl();
            
            // Record unlock count in Firestore
            await incrementUnlockCount(currentPlaylist.id);
        });
    });

    // Copy Button Click
    DOM.copyUrlBtn.addEventListener('click', () => {
        DOM.unlockedUrlInput.select();
        navigator.clipboard.writeText(DOM.unlockedUrlInput.value);
        DOM.copyAlert.style.display = 'block';
        setTimeout(() => { DOM.copyAlert.style.display = 'none'; }, 3000);
    });
}

/**
 * Universal Timer Function
 */
function startTimer(onComplete) {
    isTimerRunning = true;
    const totalSeconds = globalSettings.timerSeconds || 15;
    let remainingSeconds = totalSeconds;

    DOM.timerContainer.style.display = 'block';
    DOM.timerCountdown.textContent = remainingSeconds;
    DOM.timerProgressBar.style.width = '100%';

    const interval = setInterval(() => {
        remainingSeconds--;
        DOM.timerCountdown.textContent = remainingSeconds;
        
        const percentage = (remainingSeconds / totalSeconds) * 100;
        DOM.timerProgressBar.style.width = `${percentage}%`;

        if (remainingSeconds <= 0) {
            clearInterval(interval);
            DOM.timerContainer.style.display = 'none';
            isTimerRunning = false;
            onComplete();
        }
    }, 1000);
}

/**
 * Displays Final Destination Link Box
 */
function revealDestinationUrl() {
    DOM.unlockedUrlInput.value = currentPlaylist.playlistUrl;
    DOM.resultBox.style.display = 'block';
    DOM.resultBox.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Increments unlock count in Firestore
 */
async function incrementUnlockCount(playlistId) {
    try {
        const playlistRef = doc(db, 'playlists', playlistId);
        await updateDoc(playlistRef, {
            unlockCount: increment(1)
        });
    } catch (error) {
        console.warn("Could not update unlock count:", error);
    }
}

function showErrorState() {
    DOM.unlockLoader.style.display = 'none';
    DOM.unlockContent.style.display = 'none';
    DOM.unlockError.style.display = 'block';
}