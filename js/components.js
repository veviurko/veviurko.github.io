// Function to load HTML components
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;

        // Update active navigation link based on current page
        if (componentPath.includes('nav.html')) {
            const currentPage = window.location.pathname;
            const navLinks = document.querySelectorAll('.nav-content a');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === currentPage) {
                    link.classList.add('active');
                }
            });
        }
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
} 