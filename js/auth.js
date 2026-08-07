/**
 * GoM3U TV - Firebase Authentication Handler
 * Handles Admin Login, Logout, and Auth Guard protections for admin pages.
 */

import { auth, isFirebaseConfigured } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// DOM Elements on Login Page
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const btnText = document.querySelector('.btn-text');
const loginSpinner = document.getElementById('loginSpinner');
const authAlert = document.getElementById('authAlert');

// Page Detection Helper
const isLoginPage = window.location.pathname.includes('/admin/login.html');
const isAdminPage = window.location.pathname.includes('/admin/') && !isLoginPage;

/**
 * Initialize Auth Listeners
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Auth Guard on Protected Pages
    initAuthGuard();

    // 2. Setup Login Event Listener if on Login Page
    if (isLoginPage && loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
});

/**
 * Firebase Auth State Observer Guard
 * Redirects unauthenticated users away from protected admin pages to login.html
 */
function initAuthGuard() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is authenticated
            if (isLoginPage) {
                // If logged-in user visits login page, redirect to dashboard
                window.location.href = 'index.html';
            }
        } else {
            // User is NOT authenticated
            if (isAdminPage) {
                // Redirect unauthenticated user attempting to access dashboard
                window.location.href = 'login.html';
            }
        }
    });
}

/**
 * Handles Login Form Submission
 * @param {Event} e 
 */
async function handleLoginSubmit(e) {
    e.preventDefault();

    if (!isFirebaseConfigured()) {
        showAlert("Firebase config missing. Update js/firebase-config.js first.");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showAlert("Please enter both email and password.");
        return;
    }

    // Set Loading State
    setLoading(true);
    hideAlert();

    try {
        // Firebase Authentication Attempt
        await signInWithEmailAndPassword(auth, email, password);
        
        // Successful login automatically triggers onAuthStateChanged -> redirects to admin/index.html
    } catch (error) {
        console.error("Login Error:", error.code, error.message);
        setLoading(false);

        // Friendly Error Messages
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                showAlert("Invalid email or password.");
                break;
            case 'auth/too-many-requests':
                showAlert("Access temporarily disabled due to many failed attempts. Try later.");
                break;
            default:
                showAlert("Failed to login: " + error.message);
                break;
        }
    }
}

/**
 * Public Logout Helper Function
 */
export async function logoutAdmin() {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Logout Error:", error);
        alert("Error logging out. Please try again.");
    }
}

/**
 * Utility: Toggle Button Loading State
 * @param {boolean} isLoading 
 */
function setLoading(isLoading) {
    if (!loginBtn) return;
    
    loginBtn.disabled = isLoading;
    if (isLoading) {
        if (btnText) btnText.style.display = 'none';
        if (loginSpinner) loginSpinner.style.display = 'inline-block';
    } else {
        if (btnText) btnText.style.display = 'inline';
        if (loginSpinner) loginSpinner.style.display = 'none';
    }
}

/**
 * Utility: Display Auth Alert Error Message
 * @param {string} message 
 */
function showAlert(message) {
    if (authAlert) {
        authAlert.textContent = message;
        authAlert.style.display = 'block';
    }
}

/**
 * Utility: Hide Auth Alert Error Message
 */
function hideAlert() {
    if (authAlert) {
        authAlert.style.display = 'none';
    }
}