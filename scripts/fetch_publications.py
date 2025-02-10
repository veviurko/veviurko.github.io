from scholarly import scholarly
import json
from datetime import datetime
import os

def fetch_google_scholar_publications(author_id):
    # Load overrides if they exist
    overrides = {}
    try:
        with open('data/publication_overrides.json', 'r') as f:
            overrides = json.load(f)['overrides']
    except (FileNotFoundError, json.JSONDecodeError, KeyError):
        print("No overrides found or invalid override file")
    
    # Search for the author and fill in publication data
    author = scholarly.search_author_id(author_id)  # Returns author dict directly
    author = scholarly.fill(author)
    
    # Get all publications
    publications = []
    for pub in author['publications']:
        print('pub', pub)
        filled_pub = scholarly.fill(pub)
        print('filled_pub', filled_pub)
        # Try to get year from different possible locations
        year = filled_pub['bib'].get('pub_year', None)
        
        pub_data = {
            'title': filled_pub['bib'].get('title'),
            'authors': filled_pub['bib'].get('author', '').split(' and '),
            'year': year,
            'venue': filled_pub['bib'].get('journal', filled_pub['bib'].get('conference', '')),
            'citations': filled_pub.get('num_citations', 0),
            'url': filled_pub.get('pub_url', ''),
        }
        
        # Apply overrides if they exist for this publication
        if pub_data['title'] in overrides:
            pub_data.update(overrides[pub_data['title']])
        
        publications.append(pub_data)
    
    # Sort by year (newest first)
    publications.sort(key=lambda x: int(x['year'] or 0), reverse=True)
    
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Save to JSON file
    with open('data/publications.json', 'w') as f:
        json.dump({
            'last_updated': datetime.now().isoformat(),
            'publications': publications
        }, f, indent=2)

if __name__ == "__main__":
    # Replace with your Google Scholar ID
    AUTHOR_ID = "2jVnBAIAAAAJ&hl"
    fetch_google_scholar_publications(AUTHOR_ID) 