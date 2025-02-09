// Initialize markdown-it with KaTeX support
const md = window.markdownit({
    html: true,
    breaks: true,
    linkify: true
}).use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: {
        macros: {
            "\\RR": "\\mathbb{R}"
        }
    }
});

async function addBlogPost() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please login first');
        return;
    }

    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;

    if (!title || !content) {
        alert('Please fill in all fields');
        return;
    }

    try {
        await db.collection('blog-posts').add({
            title: title,
            content: content,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            author: user.email
        });
        
        alert('Blog post added successfully!');
        document.getElementById('postTitle').value = '';
        document.getElementById('postContent').value = '';
    } catch (error) {
        alert('Error adding blog post: ' + error.message);
    }
}

async function loadBlogPosts() {
    try {
        const blogContainer = document.getElementById('blog-container');
        if (!blogContainer) return;
        
        db.collection('blog-posts')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const postsHTML = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const renderedContent = md.render(data.content);
                    return `
                        <article class="blog-post">
                            <h2>${data.title}</h2>
                            <div class="post-meta">
                                <span>By ${data.author}</span>
                                <span>${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString() : 'Date unavailable'}</span>
                            </div>
                            <div class="post-content markdown-body">
                                ${renderedContent}
                            </div>
                            ${firebase.auth().currentUser ? 
                                `<button onclick="deleteBlogPost('${doc.id}')" class="delete-btn">Delete Post</button>` 
                                : ''}
                        </article>
                    `;
                }).join('');
                
                blogContainer.innerHTML = postsHTML;
            });
    } catch (error) {
        console.error('Error loading blog posts:', error);
    }
}

async function deleteBlogPost(docId) {
    if (!firebase.auth().currentUser) {
        alert('Please login first');
        return;
    }

    if (confirm('Are you sure you want to delete this blog post?')) {
        try {
            await db.collection('blog-posts').doc(docId).delete();
            alert('Blog post deleted successfully!');
        } catch (error) {
            alert('Error deleting blog post: ' + error.message);
        }
    }
}

function setupEditorTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const postContent = document.getElementById('postContent');
    const previewContent = document.getElementById('preview-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update active tab content
            const tabName = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');

            // Update preview content if preview tab is selected
            if (tabName === 'preview') {
                const markdown = postContent.value;
                previewContent.innerHTML = md.render(markdown);
            }
        });
    });

    // Live preview update while typing
    postContent.addEventListener('input', () => {
        const markdown = postContent.value;
        previewContent.innerHTML = md.render(markdown);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadBlogPosts();
    setupEditorTabs();
});
