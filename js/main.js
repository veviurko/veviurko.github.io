// Authentication
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('newsForm').style.display = 'block';
    } catch (error) {
        alert('Login failed: ' + error.message);
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

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('newsContainer')) {
        loadNews();
    }
});

// Check auth state
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('newsForm').style.display = 'block';
    } else {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('newsForm').style.display = 'none';
    }
});
