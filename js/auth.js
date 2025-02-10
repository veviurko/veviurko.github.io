// Login popup functionality
function showLoginPopup() {
    document.getElementById('loginPopup').style.display = 'flex';
}

function closeLoginPopup() {
    document.getElementById('loginPopup').style.display = 'none';
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        console.log('Attempting login with:', email);
        if (!firebase.auth) {
            throw new Error('Firebase auth is not initialized');
        }
        await firebase.auth().signInWithEmailAndPassword(email, password);
        console.log('Login successful');
        closeLoginPopup();
        location.reload();
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

async function logout() {
    try {
        await firebase.auth().signOut();
        location.reload();
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
}

// Update auth state check
firebase.auth().onAuthStateChanged((user) => {
    // Show/hide news controls
    const newsControls = document.getElementById('newsControls');
    if (newsControls) {
        newsControls.style.display = user ? 'block' : 'none';
    }
    
    // Show/hide admin controls for blog
    const adminControls = document.getElementById('admin-controls');
    if (adminControls) {
        adminControls.style.display = user ? 'block' : 'none';
    }
    
    // Add logout button if user is logged in
    const headerNav = document.querySelector('.nav-content');
    if (headerNav) {
        const existingLogoutBtn = document.getElementById('logoutBtn');
        if (user && !existingLogoutBtn) {
            const logoutBtn = document.createElement('a');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.href = '#';
            logoutBtn.textContent = 'Logout';
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                logout();
            };
            headerNav.appendChild(logoutBtn);
        } else if (!user && existingLogoutBtn) {
            existingLogoutBtn.remove();
        }
    }
}); 