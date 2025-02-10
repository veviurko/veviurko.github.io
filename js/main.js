// Add news

function openAddNewsModal() {
    const modal = document.getElementById('addNewsModal');
    modal.style.display = 'flex';
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('newsDate').value = today;
}

function closeAddNewsModal() {
    const modal = document.getElementById('addNewsModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('addNewsModal');
    if (event.target === modal) {
        closeAddNewsModal();
    }
}

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
        
        closeAddNewsModal();
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
        if (!newsContainer) return;
        
        db.collection('news')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const newsHTML = snapshot.docs.map(doc => `
                    <div class="news-item">
                        <span class="date">${doc.data().date}</span>
                        <p>${sanitizeAndParseLinks(doc.data().content)}</p>
                        ${firebase.auth().currentUser ? `
                            <div class="news-actions">
                                <button onclick="editNews('${doc.id}', '${doc.data().date}', '${doc.data().content.replace(/'/g, "&apos;")}')" class="edit-btn">Edit</button>
                                <button onclick="deleteNews('${doc.id}')" class="delete-btn">Delete</button>
                            </div>
                        ` : ''}
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

// Add this new function to handle link parsing and sanitization
function sanitizeAndParseLinks(text) {
    // First, escape HTML to prevent XSS
    const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    
    // Then parse markdown-style links: [text](url)
    const withLinks = escaped.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (match, text, url) => {
            // Validate URL
            try {
                const validUrl = new URL(url);
                if (validUrl.protocol === 'http:' || validUrl.protocol === 'https:') {
                    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
                }
            } catch (e) {
                console.warn('Invalid URL in news content:', url);
            }
            return match;
        }
    );
    
    return withLinks;
}

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

function editNews(docId, date, content) {
    const modal = document.getElementById('addNewsModal');
    const modalTitle = modal.querySelector('h2');
    const dateInput = document.getElementById('newsDate');
    const contentInput = document.getElementById('newsContent');
    const addButton = modal.querySelector('button:not(.cancel-btn)');
    
    modalTitle.textContent = 'Edit News';
    dateInput.value = date;
    contentInput.value = content;
    addButton.textContent = 'Update';
    addButton.onclick = () => updateNews(docId);
    
    modal.style.display = 'flex';
}

async function updateNews(docId) {
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
        await db.collection('news').doc(docId).update({
            date: date,
            content: content,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeAddNewsModal();
        resetNewsModal();
    } catch (error) {
        alert('Error updating news: ' + error.message);
    }
}

function resetNewsModal() {
    const modal = document.getElementById('addNewsModal');
    const modalTitle = modal.querySelector('h2');
    const addButton = modal.querySelector('button:not(.cancel-btn)');
    
    modalTitle.textContent = 'Add News';
    addButton.textContent = 'Add';
    addButton.onclick = addNews;
    
    document.getElementById('newsDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('newsContent').value = '';
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('newsContainer')) {
        loadNews();
    }
});