// ─── FIREBASE CONFIG ──────────────────────────────────────────────
// 🔽 PASTE YOUR FIREBASE CONFIG HERE 🔽
const firebaseConfig = {
  apiKey: "AIzaSyAO5yX55PnOAck7M2GeJrrzjkh9EVLVvzg",
  authDomain: "chokesafe-food-db.firebaseapp.com",
  projectId: "chokesafe-food-db",
  storageBucket: "chokesafe-food-db.firebasestorage.app",
  messagingSenderId: "18615653962",
  appId: "1:18615653962:web:c3d385f094485132aab8b3",
  measurementId: "G-X3L1X5TTPE"
};
// 🔼 PASTE YOUR FIREBASE CONFIG ABOVE 🔼

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ─── AUTH STATE ──────────────────────────────────────────────────
function checkUserAuth() {
    const currentUser = sessionStorage.getItem("current_session_phone");
    return currentUser ? true : false;
}

// ─── REGISTER USER ──────────────────────────────────────────────
async function processRegistration() {
    const nameIn = document.getElementById('reg-fullname').value.trim();
    const codeIn = document.getElementById('reg-country-code').value;
    const phoneRaw = document.getElementById('reg-phone').value.trim();

    if (!nameIn || !phoneRaw) {
        alert("Please fill in all registration fields.");
        return;
    }

    const phoneProcessed = phoneRaw.replace(/^0+/, '');
    const fullPhoneKey = codeIn + phoneProcessed;

    try {
        // Check if phone already exists
        const snapshot = await db.collection('users').where('phone', '==', fullPhoneKey).get();
        if (!snapshot.empty) {
            alert("This phone number is already registered.");
            return;
        }

        // Add new user
        await db.collection('users').add({
            fullname: nameIn,
            phone: fullPhoneKey,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Registration successful! Redirecting to Sign In.");
        document.getElementById('reg-fullname').value = '';
        document.getElementById('reg-phone').value = '';
        toggleAuthMode('signin');
        document.getElementById('login-phone').value = phoneProcessed;
        document.getElementById('login-country-code').value = codeIn;

    } catch (err) {
        alert("Registration failed: " + err.message);
        console.error(err);
    }
}

// ─── LOGIN USER ──────────────────────────────────────────────────
async function processLogin() {
    const codeIn = document.getElementById('login-country-code').value;
    const phoneRaw = document.getElementById('login-phone').value.trim();

    if (!phoneRaw) {
        alert("Please enter your registered phone number.");
        return;
    }

    const phoneProcessed = phoneRaw.replace(/^0+/, '');
    const fullPhoneKey = codeIn + phoneProcessed;

    try {
        const snapshot = await db.collection('users').where('phone', '==', fullPhoneKey).get();
        if (snapshot.empty) {
            alert("Account not found. Please verify your phone credentials or sign up.");
            return;
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        sessionStorage.setItem("current_session_phone", userData.phone);
        sessionStorage.setItem("current_session_name", userData.fullname);
        sessionStorage.setItem("session_is_guest", "false");

        window.location.href = "homepage.html";

    } catch (err) {
        alert("Login failed: " + err.message);
        console.error(err);
    }
}

// ─── GUEST BYPASS ──────────────────────────────────────────────────
function bypassAsGuest() {
    const guestToggle = localStorage.getItem('feature_guest');
    const guestEnabled = guestToggle !== null ? guestToggle === 'true' : true;
    if (!guestEnabled) {
        alert('Guest access is currently disabled. Please sign in.');
        return;
    }
    sessionStorage.setItem("current_session_phone", "GUEST_USER");
    sessionStorage.setItem("current_session_name", "Guest");
    sessionStorage.setItem("session_is_guest", "true");
    window.location.href = "homepage.html";
}

// ─── LOGOUT ──────────────────────────────────────────────────────
function handleLogout() {
    if (typeof stopCameraTracks === "function") {
        stopCameraTracks();
    }
    sessionStorage.clear();
    window.location.href = "index.html";
}

// ─── SAVE SCAN TO HISTORY (Firestore) ───────────────────────────
async function saveScanToHistory(foodName, riskLevel, reason, advice) {
    const currentUserPhone = sessionStorage.getItem("current_session_phone") || "GUEST_USER";
    const currentUserName = sessionStorage.getItem("current_session_name") || "Guest";

    try {
        await db.collection('scans').add({
            phone: currentUserPhone,
            userName: currentUserName,
            foodName: foodName,
            riskLevel: riskLevel,
            reason: reason,
            advice: advice,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Scan saved to Firestore');
    } catch (err) {
        console.error('Failed to save scan:', err);
    }
}

// ─── GET USER NAME ──────────────────────────────────────────────
async function getUserName(phone) {
    if (!phone || phone === 'GUEST_USER') return 'Guest';
    try {
        const snapshot = await db.collection('users').where('phone', '==', phone).get();
        if (!snapshot.empty) {
            return snapshot.docs[0].data().fullname;
        }
        return 'Unknown';
    } catch (err) {
        console.error('Error fetching user:', err);
        return 'Unknown';
    }
}

// ─── SLIDING TOGGLE CONTROLLER ──────────────────────────────────
function toggleAuthMode(mode) {
    const slider = document.getElementById('auth-slider');
    const tabSignIn = document.getElementById('tab-signin');
    const tabSignUp = document.getElementById('tab-signup');
    const formSignIn = document.getElementById('form-signin');
    const formSignUp = document.getElementById('form-signup');

    if (!slider) return;

    if (mode === 'signin') {
        slider.style.transform = 'translateX(0)';
        tabSignIn.classList.add('text-rose-700');
        tabSignIn.classList.remove('text-stone-400');
        tabSignUp.classList.add('text-stone-400');
        tabSignUp.classList.remove('text-rose-700');
        formSignIn.classList.remove('hidden');
        formSignUp.classList.add('hidden');
    } else {
        slider.style.transform = 'translateX(100%)';
        tabSignUp.classList.add('text-rose-700');
        tabSignUp.classList.remove('text-stone-400');
        tabSignIn.classList.add('text-stone-400');
        tabSignIn.classList.remove('text-rose-700');
        formSignUp.classList.remove('hidden');
        formSignIn.classList.add('hidden');
    }
}

// ─── ROUTING SECURITY GUARD ─────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
    const currentPage = window.location.pathname.split("/").pop();
    const currentUserPhone = sessionStorage.getItem("current_session_phone");
    const isGuest = sessionStorage.getItem("session_is_guest") === "true";

    const historyNavBtn = document.getElementById('nav-history-btn');
    const accountNavBtn = document.getElementById('nav-account-btn');

    if (historyNavBtn) {
        if (isGuest) historyNavBtn.classList.add('hidden');
        else historyNavBtn.classList.remove('hidden');
    }
    if (accountNavBtn) {
        if (isGuest) accountNavBtn.classList.add('hidden');
        else accountNavBtn.classList.remove('hidden');
    }

    const protectedPages = ["homepage.html", "history.html", "guide.html", "account.html"];
    if (protectedPages.includes(currentPage) || currentPage === "") {
        if (!currentUserPhone) {
            alert("Access Denied. Please sign in first.");
            window.location.href = "index.html";
            return;
        }
    }

    if (currentPage === "homepage.html") {
        const welcomeMsg = document.getElementById('welcome-message');
        const statusDot = document.getElementById('user-status-dot');
        const currentUserName = sessionStorage.getItem("current_session_name");

        if (welcomeMsg && statusDot) {
            if (isGuest) {
                welcomeMsg.textContent = "Logged in as Guest";
                statusDot.className = "inline-block w-2.5 h-2.5 rounded-full bg-amber-500";
            } else {
                welcomeMsg.textContent = `Welcome back, ${currentUserName}!`;
                statusDot.className = "inline-block w-2.5 h-2.5 rounded-full bg-emerald-500";
            }
        }
    }

    if (typeof initPageSpecificUI === "function") {
        initPageSpecificUI();
    }
});
