async function loadPublications() {
    try {
        const response = await fetch('../_data/publications.json');
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
    }
}

document.addEventListener('DOMContentLoaded', loadPublications); 