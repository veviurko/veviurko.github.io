// Authentication
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
        await firebase.auth().signInWithEmailAndPassword(email, password);
        alert('Login successful!');
        closeLoginPopup();
        location.reload();
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Add logout function
async function logout() {
    try {
        await firebase.auth().signOut();
        location.reload(); // Reload to update UI
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
}

// Add news
async function addNews() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please login first');
        return;
    }

    const date = document.getElementById('newsDate').value;
    const content = document.getElementById('newsContent').value;

    if (!date || !content) {
        alert('Please fill in all fields');
        return;
    }

    try {
        await db.collection('news').add({
            date: date,
            content: content,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('News added successfully!');
        document.getElementById('newsDate').value = '';
        document.getElementById('newsContent').value = '';
    } catch (error) {
        alert('Error adding news: ' + error.message);
    }
}

// Load news
async function loadNews() {
    try {
        const newsContainer = document.getElementById('newsContainer');
        if (!newsContainer) return; // Exit if we're not on a page with news
        
        // Real-time updates
        db.collection('news')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const newsHTML = snapshot.docs.map(doc => `
                    <div class="news-item">
                        <span class="date">${doc.data().date}</span>
                        <p>${doc.data().content}</p>
                        ${firebase.auth().currentUser ? 
                            `<button onclick="deleteNews('${doc.id}')" class="delete-btn">Delete</button>` 
                            : ''}
                    </div>
                `).join('');
                
                newsContainer.innerHTML = newsHTML;
            }, (error) => {
                console.error("Error loading news:", error);
            });
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

// Add this new function for deleting news
async function deleteNews(docId) {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please login first');
        return;
    }

    if (confirm('Are you sure you want to delete this news item?')) {
        try {
            await db.collection('news').doc(docId).delete();
            alert('News deleted successfully!');
        } catch (error) {
            alert('Error deleting news: ' + error.message);
        }
    }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
    const adminLinks = document.querySelectorAll('a[href="admin.html"]');
    adminLinks.forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            showLoginPopup();
        };
    });

    if (document.getElementById('newsContainer')) {
        loadNews();
    }
});

// Update auth state check
firebase.auth().onAuthStateChanged((user) => {
    // Show/hide news controls
    const newsControls = document.getElementById('newsControls');
    if (newsControls) {
        newsControls.style.display = user ? 'block' : 'none';
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
