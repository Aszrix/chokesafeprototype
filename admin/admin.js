// ─── FIREBASE CONFIG ──────────────────────────────────────────────
// 🔽 PASTE YOUR FIREBASE CONFIG HERE 🔽
const firebaseConfig = {
    apiKey: "AIzaSyCJwAtpzdEWBFOcuOVcj843e1qkEJi4XpQ",
    authDomain: "chokesafe-food-db-e6ca4.firebaseapp.com",
    projectId: "chokesafe-food-db-e6ca4",
    storageBucket: "chokesafe-food-db-e6ca4.firebasestorage.app",
    messagingSenderId: "568429975420",
    appId: "1:568429975420:web:205f67666d23397d52b6f9"
};
// 🔼 PASTE YOUR FIREBASE CONFIG ABOVE 🔼

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ─── ADMIN LOGIN STATE ─────────────────────────────────────────────
const ADMIN_SESSION_KEY = 'admin_logged_in';

function checkAdminAuth() {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) !== 'true') {
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'index.html' && currentPage !== 'forgot-password.html') {
            window.location.href = 'index.html';
        }
        return false;
    }
    return true;
}

function logout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.location.href = 'index.html';
}

// ─── HELPER: Get user name from phone (Firebase) ──────────────────────
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

// ─── HELPER: Group foods by keyword ────────────────────────────────
function getFoodCategory(foodName) {
    const lower = foodName.toLowerCase();
    const groups = {
        'Gummy Candies': ['gummy', 'gummi', 'bear', 'worm', 'candy'],
        'Meat/Fish Balls': ['fishball', 'meatball', 'ball'],
        'Boba/Tapioca': ['boba', 'tapioca', 'pearl', 'bubble'],
        'Fruits': ['apple', 'banana', 'grape', 'watermelon', 'melon', 'orange', 'strawberry', 'blueberry', 'kiwi', 'pineapple', 'mango'],
        'Vegetables': ['broccoli', 'carrot', 'cauliflower', 'cabbage', 'lettuce', 'spinach', 'pepper', 'cucumber', 'zucchini', 'onion'],
        'Beverages': ['water', 'juice', 'milk', 'soda', 'drink', 'tea', 'coffee', 'milo', 'lemon', 'matcha'],
        'Bread/Pastry': ['bread', 'toast', 'croissant', 'pastry', 'bun', 'roll'],
        'Meat': ['chicken', 'beef', 'pork', 'fish', 'lamb', 'turkey', 'tuna', 'steak'],
        'Snacks': ['chip', 'cracker', 'cookie', 'biscuit', 'pretzel', 'popcorn'],
        'Dairy': ['yogurt', 'cheese', 'milk', 'cream', 'butter'],
        'Pasta/Rice': ['pasta', 'spaghetti', 'macaroni', 'rice', 'noodle']
    };
    for (const [category, keywords] of Object.entries(groups)) {
        for (const kw of keywords) {
            if (lower.includes(kw)) return category;
        }
    }
    return foodName;
}
