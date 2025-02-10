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

let currentEditId = null;

function showEditor(isEdit = false) {
    const dialog = document.getElementById('postEditorDialog');
    dialog.style.display = 'flex';
    document.getElementById('editorTitle').textContent = isEdit ? 'Edit Post' : 'New Post';
}

function hideEditor() {
    const dialog = document.getElementById('postEditorDialog');
    dialog.style.display = 'none';
    resetEditor();
}

function resetEditor() {
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postTags').value = '';
    document.getElementById('postPreview').value = '';
    currentEditId = null;
}

async function savePost() {
    const user = firebase.auth().currentUser;
    if (!user) {
        alert('Please login first');
        return;
    }

    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const tags = document.getElementById('postTags').value.split(',').map(tag => tag.trim());
    const preview = document.getElementById('postPreview').value;

    if (!title || !content) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const postData = {
            title,
            content,
            tags,
            preview,
            author: user.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            lastModified: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (currentEditId) {
            await db.collection('blog-posts').doc(currentEditId).update(postData);
        } else {
            await db.collection('blog-posts').add(postData);
        }

        alert(`Blog post ${currentEditId ? 'updated' : 'added'} successfully!`);
        hideEditor();
        loadBlogPosts();
    } catch (error) {
        alert('Error saving blog post: ' + error.message);
    }
}

async function loadBlogPosts() {
    try {
        const snapshot = await db.collection('blog-posts')
            .orderBy('timestamp', 'desc')
            .get();

        const container = document.getElementById('blog-container');
        container.innerHTML = '';

        snapshot.forEach(doc => {
            const post = doc.data();
            const postElement = document.createElement('article');
            postElement.className = 'blog-post';
            
            const postDate = post.timestamp ? post.timestamp.toDate() : new Date();
            const truncatedContent = post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content;

            postElement.innerHTML = `
                <div class="blog-title">
                    <h2><a href="post.html?id=${doc.id}">${post.title}</a></h2>
                </div>
                <div class="blog-meta">
                    ${postDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
                <div class="blog-preview">
                    ${post.preview || truncatedContent}
                </div>
                <div class="blog-content">
                    ${md.render(post.content || '')}
                </div>
                <div class="blog-tags">
                    ${post.tags ? post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('') : ''}
                </div>
                <div class="post-actions" ${firebase.auth().currentUser?.email === post.author ? '' : 'style="display: none;"'}>
                    <button class="edit-button" onclick="editPost('${doc.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-button" onclick="deleteBlogPost('${doc.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            
            container.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading blog posts:', error);
        const container = document.getElementById('blog-container');
        container.innerHTML = `<div class="error">Failed to load blog posts. Error: ${error.message}</div>`;
    }
}

async function editPost(docId) {
    try {
        const doc = await db.collection('blog-posts').doc(docId).get();
        if (!doc.exists) {
            alert('Post not found');
            return;
        }

        const post = doc.data();
        currentEditId = docId;
        
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postContent').value = post.content;
        document.getElementById('postTags').value = post.tags ? post.tags.join(', ') : '';
        document.getElementById('postPreview').value = post.preview || '';
        
        showEditor(true);
    } catch (error) {
        alert('Error loading post for editing: ' + error.message);
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

// Modify the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    loadBlogPosts();
    setupEditorTabs();

    // Add event listeners for editor buttons
    const newPostBtn = document.getElementById('newPostBtn');
    if (newPostBtn) {
        newPostBtn.addEventListener('click', () => showEditor(false));
    }
    
    document.getElementById('cancelEditBtn')?.addEventListener('click', hideEditor);
    document.getElementById('savePostBtn')?.addEventListener('click', savePost);

    // Check initial auth state
    updateAdminControls();
});

// Update the updateAdminControls function to be more robust
function updateAdminControls() {
    const user = firebase.auth().currentUser;
    const adminControls = document.getElementById('admin-controls');
    
    if (adminControls) {
        if (user) {
            adminControls.style.display = 'block';
        } else {
            adminControls.style.display = 'none';
        }
    }
}

// Make sure we update controls whenever auth state changes
firebase.auth().onAuthStateChanged(user => {
    updateAdminControls();
});
