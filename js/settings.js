/**
 * GoM3U TV - Global Settings Controller
 * Handles Firestore Global System Configuration (settings/global)
 */

import { db } from './firebase-config.js';
import { logoutAdmin } from './auth.js';
import { 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Selectors
const DOM = {
    logoutBtn: document.getElementById('logoutBtn'),
    settingsForm: document.getElementById('settingsForm'),
    settingsAlert: document.getElementById('settingsAlert'),
    
    // Inputs
    defaultStep1Url: document.getElementById('defaultStep1Url'),
    defaultStep2Url: document.getElementById('defaultStep2Url'),
    timerSeconds: document.getElementById('timerSeconds'),
    siteName: document.getElementById('siteName'),
    noticeBanner: document.getElementById('noticeBanner'),
    
    // Button Loader
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    saveBtnText: document.getElementById('saveBtnText'),
    saveSpinner: document.getElementById('saveSpinner')
};

const SETTINGS_DOC_REF = doc(db, 'settings', 'global');

// Initialize Controller
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    loadGlobalSettings();
});

function initEvents() {
    if (DOM.logoutBtn) {
        DOM.logoutBtn.addEventListener('click', logoutAdmin);
    }

    if (DOM.settingsForm) {
        DOM.settingsForm.addEventListener('submit', handleSaveSettings);
    }
}

/**
 * Loads Global Settings from Firestore (settings/global)
 */
async function loadGlobalSettings() {
    hideAlert();
    setSaveLoading(true);

    try {
        const docSnap = await getDoc(SETTINGS_DOC_REF);

        if (docSnap.exists()) {
            const data = docSnap.data();
            DOM.defaultStep1Url.value = data.defaultStep1Url || '';
            DOM.defaultStep2Url.value = data.defaultStep2Url || '';
            DOM.timerSeconds.value = data.timerSeconds || 15;
            DOM.siteName.value = data.siteName || 'GoM3U TV';
            DOM.noticeBanner.value = data.noticeBanner || '';
        } else {
            // Default Fallback Values
            DOM.timerSeconds.value = 15;
            DOM.siteName.value = 'GoM3U TV';
        }
    } catch (error) {
        console.error("Error loading global settings:", error);
        showAlert("Failed to load global settings from database.", "danger");
    } finally {
        setSaveLoading(false);
    }
}

/**
 * Handles Form Submission to Update Global Settings
 */
async function handleSaveSettings(e) {
    e.preventDefault();

    const defaultStep1Url = DOM.defaultStep1Url.value.trim();
    const defaultStep2Url = DOM.defaultStep2Url.value.trim();
    const timerSeconds = parseInt(DOM.timerSeconds.value, 10);
    const siteName = DOM.siteName.value.trim();
    const noticeBanner = DOM.noticeBanner.value.trim();

    if (!defaultStep1Url || !defaultStep2Url || isNaN(timerSeconds)) {
        alert("Please fill in all required fields correctly.");
        return;
    }

    setSaveLoading(true);

    try {
        const settingsData = {
            defaultStep1Url,
            defaultStep2Url,
            timerSeconds: timerSeconds || 15,
            siteName: siteName || 'GoM3U TV',
            noticeBanner: noticeBanner || '',
            updatedAt: serverTimestamp()
        };

        // Save or update document in Firestore
        await setDoc(SETTINGS_DOC_REF, settingsData, { merge: true });
        
        showAlert("Global settings updated successfully!", "success");
    } catch (error) {
        console.error("Error saving global settings:", error);
        showAlert("Failed to save settings: " + error.message, "danger");
    } finally {
        setSaveLoading(false);
    }
}

/**
 * UI Utility Functions
 */
function setSaveLoading(isLoading) {
    if (!DOM.saveSettingsBtn) return;
    DOM.saveSettingsBtn.disabled = isLoading;
    DOM.saveBtnText.style.display = isLoading ? 'none' : 'inline';
    DOM.saveSpinner.style.display = isLoading ? 'inline-block' : 'none';
}

function showAlert(message, type = 'info') {
    if (DOM.settingsAlert) {
        DOM.settingsAlert.textContent = message;
        DOM.settingsAlert.className = `alert alert-${type}`;
        DOM.settingsAlert.style.display = 'block';
        setTimeout(hideAlert, 4000);
    }
}

function hideAlert() {
    if (DOM.settingsAlert) {
        DOM.settingsAlert.style.display = 'none';
    }
}