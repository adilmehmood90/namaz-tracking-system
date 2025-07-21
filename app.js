// Get references to HTML elements
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const dashboardSection = document.getElementById('dashboard-section');
const historySection = document.getElementById('history-section');

const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const showRegisterLink = document.getElementById('show-register');

const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerBtn = document.getElementById('register-btn');
const registerError = document.getElementById('register-error');
const showLoginLink = document.getElementById('show-login');

const navDashboardBtn = document.getElementById('nav-dashboard');
const navHistoryBtn = document.getElementById('nav-history');
const navLogoutBtn = document.getElementById('nav-logout');

const dashboardDateSpan = document.getElementById('dashboard-date');
const userEmailDisplay = document.getElementById('user-email-display');
const togglePrayerBtns = document.querySelectorAll('.toggle-prayer-btn');
const dashboardMessage = document.getElementById('dashboard-message');

const historyDaysSelect = document.getElementById('history-days');
const loadHistoryBtn = document.getElementById('load-history-btn');
const historyList = document.getElementById('history-list');
const historyMessage = document.getElementById('history-message');

let currentUser = null; // To store the currently logged-in user

// --- Utility Functions ---

function showSection(section) {
    loginSection.style.display = 'none';
    registerSection.style.display = 'none';
    dashboardSection.style.display = 'none';
    historySection.style.display = 'none';
    section.style.display = 'block';
}

function showMessage(element, message, type = 'info') {
    element.textContent = message;
    element.className = `info-message ${type}`; // Add type for styling (e.g., 'error', 'success')
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
        element.textContent = '';
    }, 5000); // Hide after 5 seconds
}

function getFormattedDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function getFirestoreDateId(date) {
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

// --- Authentication Functions ---

// Listen for auth state changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        currentUser = user;
        userEmailDisplay.textContent = user.email;
        navDashboardBtn.style.display = 'inline-block';
        navHistoryBtn.style.display = 'inline-block';
        navLogoutBtn.style.display = 'inline-block';
        showSection(dashboardSection);
        loadDashboardPrayers();
    } else {
        // User is signed out
        currentUser = null;
        navDashboardBtn.style.display = 'none';
        navHistoryBtn.style.display = 'none';
        navLogoutBtn.style.display = 'none';
        showSection(loginSection); // Default to login page
    }
});

// Login User
loginBtn.addEventListener('click', async () => {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    if (!email || !password) {
        showMessage(loginError, 'Please enter both email and password.', 'error');
        return;
    }
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showMessage(loginError, 'Logged in successfully!', 'success');
        loginEmailInput.value = '';
        loginPasswordInput.value = '';
    } catch (error) {
        showMessage(loginError, error.message, 'error');
    }
});

// Register User
registerBtn.addEventListener('click', async () => {
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;
    if (!email || !password) {
        showMessage(registerError, 'Please enter both email and password.', 'error');
        return;
    }
    if (password.length < 6) {
        showMessage(registerError, 'Password should be at least 6 characters.', 'error');
        return;
    }
    try {
        await auth.createUserWithEmailAndPassword(email, password);
        showMessage(registerError, 'Registration successful! You are now logged in.', 'success');
        registerEmailInput.value = '';
        registerPasswordInput.value = '';
    } catch (error) {
        showMessage(registerError, error.message, 'error');
    }
});

// Logout User
navLogoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        showMessage(dashboardMessage, 'Logged out successfully.', 'info');
    } catch (error) {
        showMessage(dashboardMessage, `Logout error: ${error.message}`, 'error');
    }
});

// --- Navigation ---
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(registerSection);
    loginError.style.display = 'none'; // Clear previous errors
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(loginSection);
    registerError.style.display = 'none'; // Clear previous errors
});

navDashboardBtn.addEventListener('click', () => {
    showSection(dashboardSection);
    loadDashboardPrayers();
});

navHistoryBtn.addEventListener('click', () => {
    showSection(historySection);
    // Automatically load history for default 7 days when entering history section
    loadNamazHistory(historyDaysSelect.value);
});


// --- Dashboard Functions ---

async function loadDashboardPrayers() {
    if (!currentUser) return;

    const today = new Date();
    dashboardDateSpan.textContent = getFormattedDate(today);
    const dateId = getFirestoreDateId(today);
    const userId = currentUser.uid;

    try {
        const docRef = db.collection('users').doc(userId).collection('namazRecords').doc(dateId);
        const docSnap = await docRef.get();

        const prayers = {
            fajr: false,
            dhuhr: false,
            asr: false,
            maghrib: false,
            isha: false
        };

        if (docSnap.exists) {
            Object.assign(prayers, docSnap.data());
        }

        // Update UI based on fetched data
        togglePrayerBtns.forEach(button => {
            const prayerName = button.dataset.prayer;
            if (prayers[prayerName]) {
                button.textContent = '✅';
                button.classList.add('done');
                button.classList.remove('missed');
            } else {
                button.textContent = '❌';
                button.classList.add('missed');
                button.classList.remove('done');
            }
        });
        showMessage(dashboardMessage, 'Dashboard loaded successfully.', 'info');

    } catch (error) {
        showMessage(dashboardMessage, `Error loading dashboard: ${error.message}`, 'error');
    }
}

togglePrayerBtns.forEach(button => {
    button.addEventListener('click', async (e) => {
        if (!currentUser) {
            showMessage(dashboardMessage, 'Please log in to track prayers.', 'error');
            return;
        }

        const prayerName = e.target.dataset.prayer;
        const today = new Date();
        const dateId = getFirestoreDateId(today);
        const userId = currentUser.uid;

        const docRef = db.collection('users').doc(userId).collection('namazRecords').doc(dateId);

        try {
            const docSnap = await docRef.get();
            let currentPrayers = {};
            if (docSnap.exists) {
                currentPrayers = docSnap.data();
            }

            const newStatus = !currentPrayers[prayerName]; // Toggle status

            // Update local UI immediately
            if (newStatus) {
                e.target.textContent = '✅';
                e.target.classList.add('done');
                e.target.classList.remove('missed');
            } else {
                e.target.textContent = '❌';
                e.target.classList.add('missed');
                e.target.classList.remove('done');
            }

            // Update Firestore
            await docRef.set({
                [prayerName]: newStatus,
                timestamp: firebase.firestore.FieldValue.serverTimestamp() // Add/update timestamp
            }, { merge: true }); // Use merge to only update the specific prayer field

            showMessage(dashboardMessage, `${prayerName.charAt(0).toUpperCase() + prayerName.slice(1)} prayer status updated!`, 'success');

        } catch (error) {
            showMessage(dashboardMessage, `Error updating prayer: ${error.message}`, 'error');
        }
    });
});

// --- Namaz History Functions ---

loadHistoryBtn.addEventListener('click', () => {
    loadNamazHistory(historyDaysSelect.value);
});

async function loadNamazHistory(days) {
    if (!currentUser) {
        showMessage(historyMessage, 'Please log in to view history.', 'error');
        return;
    }

    historyList.innerHTML = '<p>Loading history...</p>';
    const userId = currentUser.uid;
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - (parseInt(days) - 1)); // Go back X days

    try {
        const namazRecordsRef = db.collection('users').doc(userId).collection('namazRecords');
        const querySnapshot = await namazRecordsRef
            .orderBy('timestamp', 'desc') // Order by timestamp to get recent
            .limit(parseInt(days) * 2) // Fetch a bit more to be safe for 30 days, then filter locally
            .get();

        let records = {};
        querySnapshot.forEach(doc => {
            const dateId = doc.id; // YYYY-MM-DD format
            records[dateId] = doc.data();
        });

        historyList.innerHTML = ''; // Clear loading message

        let hasRecords = false;
        for (let i = 0; i < parseInt(days); i++) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dateId = getFirestoreDateId(date);
            const formattedDate = getFormattedDate(date);

            const prayerData = records[dateId] || {
                fajr: false,
                dhuhr: false,
                asr: false,
                maghrib: false,
                isha: false
            };
            const card = document.createElement('div');
            card.className = 'history-day-card';
            card.innerHTML = `<h3>${formattedDate}</h3>`;

            const prayersContainer = document.createElement('div');
            prayersContainer.className = 'prayer-list';

            const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
            prayerNames.forEach(prayer => {
                const prayerStatus = prayerData[prayer];
                const prayerItem = document.createElement('div');
                prayerItem.className = 'prayer-item';
                prayerItem.innerHTML = `
                    <span>${prayer.charAt(0).toUpperCase() + prayer.slice(1)}</span>
                    <button class="toggle-history-prayer-btn ${prayerStatus ? 'done' : 'missed'}"
                            data-date="${dateId}" data-prayer="${prayer}">
                        ${prayerStatus ? '✅' : '❌'}
                    </button>
                `;
                prayersContainer.appendChild(prayerItem);
            });
            card.appendChild(prayersContainer);
            historyList.appendChild(card);
            hasRecords = true;
        }

        if (!hasRecords) {
            showMessage(historyMessage, 'No prayer records found for the selected period.', 'info');
        } else {
            showMessage(historyMessage, `History for last ${days} days loaded.`, 'success');
        }

        // Add event listeners to history prayer buttons
        document.querySelectorAll('.toggle-history-prayer-btn').forEach(button => {
            button.addEventListener('click', updateHistoryPrayerStatus);
        });

    } catch (error) {
        showMessage(historyMessage, `Error loading history: ${error.message}`, 'error');
    }
}

async function updateHistoryPrayerStatus(event) {
    if (!currentUser) {
        showMessage(historyMessage, 'Please log in to update records.', 'error');
        return;
    }

    const button = event.target;
    const dateId = button.dataset.date;
    const prayerName = button.dataset.prayer;
    const userId = currentUser.uid;

    const docRef = db.collection('users').doc(userId).collection('namazRecords').doc(dateId);

    try {
        const docSnap = await docRef.get();
        let currentPrayers = {};
        if (docSnap.exists) {
            currentPrayers = docSnap.data();
        }

        const newStatus = !currentPrayers[prayerName]; // Toggle status

        // Update local UI immediately
        if (newStatus) {
            button.textContent = '✅';
            button.classList.add('done');
            button.classList.remove('missed');
        } else {
            button.textContent = '❌';
            button.classList.add('missed');
            button.classList.remove('done');
        }

        // Update Firestore
        await docRef.set({
            [prayerName]: newStatus,
            timestamp: firebase.firestore.FieldValue.serverTimestamp() // Update timestamp
        }, { merge: true }); // Use merge to only update the specific prayer field

        showMessage(historyMessage, `${prayerName.charAt(0).toUpperCase() + prayerName.slice(1)} for ${dateId} updated!`, 'success');

    } catch (error) {
        showMessage(historyMessage, `Error updating history prayer: ${error.message}`, 'error');
    }
}

// Initial load of dashboard if user is already authenticated (handled by onAuthStateChanged)
// This ensures correct section is shown on page load or refresh.