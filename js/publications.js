async function loadPublications() {
    try {
        // Try multiple possible paths
        const possiblePaths = [
            '../data/publications.json',  // Local development
            '/data/publications.json',     // GitHub Pages
            './data/publications.json'     // Alternative GitHub Pages path
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
            throw new Error('Failed to load publications from any path');
        }

        const data = await response.json();
        
        const container = document.getElementById('publications-container');
        
        // Sort publications by year (descending)
        const publications = data.publications.sort((a, b) => {
            return (b.year || 9999) - (a.year || 9999);
        });

        publications.forEach(pub => {
            const pubElement = document.createElement('div');
            pubElement.className = 'publication-item';
            
            pubElement.innerHTML = `
                <div class="publication-title">${pub.title}</div>
                <div class="publication-authors">${pub.authors.join(', ')}</div>
                <div class="publication-venue">${pub.venue}</div>
                <span class="publication-year">${pub.year || 'Forthcoming'}</span>
                ${pub.citations ? `<span class="publication-citations">
                    <i class="fas fa-quote-right"></i> ${pub.citations} citations
                </span>` : ''}
                ${pub.url ? `<a href="${pub.url}" class="publication-link" target="_blank">
                    <i class="fas fa-external-link-alt"></i> Link
                </a>` : ''}
            `;
            
            container.appendChild(pubElement);
        });
    } catch (error) {
        console.error('Error loading publications:', error);
        const container = document.getElementById('publications-container');
        container.innerHTML = `<div class="error">Failed to load publications. Error: ${error.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadPublications); 