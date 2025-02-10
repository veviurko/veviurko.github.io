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
        const possiblePaths = [
            '../data/blog.json',
            '/data/blog.json',
            './data/blog.json'
        ];

        let response;
        for (const path of possiblePaths) {
            try {
                response = await fetch(path);
                if (response.ok) break;
            } catch (e) {
                continue;
            }
        }

        if (!response || !response.ok) {
            throw new Error('Failed to load blog posts from any path');
        }

        const data = await response.json();
        const container = document.getElementById('blog-container');
        
        // Sort blog posts by date (most recent first)
        const posts = data.posts.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        posts.forEach(post => {
            const postElement = document.createElement('article');
            postElement.className = 'blog-post';
            
            postElement.innerHTML = `
                <div class="blog-title">
                    <a href="${post.url}">${post.title}</a>
                </div>
                <div class="blog-meta">
                    ${new Date(post.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
                <div class="blog-preview">
                    ${post.preview}
                </div>
                <div class="blog-tags">
                    ${post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                </div>
                <a href="${post.url}" class="read-more">Read more →</a>
            `;
            
            container.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading blog posts:', error);
        const container = document.getElementById('blog-container');
        container.innerHTML = `<div class="error">Failed to load blog posts. Error: ${error.message}</div>`;
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
