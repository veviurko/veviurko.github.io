// import { doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; // Ensure doc and getDoc are imported


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


async function loadPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    // const doc = await db.collection('blog-posts').doc(postId).get();
    console.log('Post ID:', postId);

    if (!postId) {
        document.getElementById('post-container').innerHTML = '<div class="error">Post not found.</div>';
        return;
    }

    try {
        const docSnap = await db.collection('blog-posts').doc(postId).get();
        // const docSnap = await getDoc(docRef);

        console.log('Document snapshot:', docSnap);

        // if (!docSnap.exists()) {
        //     document.getElementById('post-container').innerHTML = '<div class="error">Post not found.</div>';
        //     return;
        // }

        const post = docSnap.data();
        const postDate = post.timestamp ? post.timestamp.toDate() : new Date();

        document.getElementById('post-container').innerHTML = `
            <article class="blog-post">
                <h2>${post.title}</h2>
                <div class="blog-meta">
                    ${postDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
                <div class="blog-content">
                    ${md.render(post.content || '')}
                </div>
                <div class="blog-tags">
                    ${post.tags ? post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('') : ''}
                </div>
            </article>
        `;
    } catch (error) {
        console.error('Error loading post:', error);
        document.getElementById('post-container').innerHTML = `<div class="error">Failed to load post. Error: ${error.message}</div>`;
    }
}

// Load the post when the page is ready
document.addEventListener('DOMContentLoaded', loadPost); 