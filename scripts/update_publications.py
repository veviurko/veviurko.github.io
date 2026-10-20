"""Refresh the cached bibliography from the owner's Google Scholar profile.

Network errors fail the job without touching the published snapshot. Editorial
metadata lives in content/publication_overrides.json. New papers are listed
chronologically but never automatically promoted to homepage selections.
"""
import argparse, copy, hashlib, json, re, unicodedata
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
AUTHOR_ID='2jVnBAIAAAAJ'
def key(title):
 return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',title).encode('ascii','ignore').decode().lower())
def safe_url(url):
 return isinstance(url,str) and url.startswith(('https://','http://'))
def merge(existing, incoming, editorial):
 if not incoming: raise ValueError('Scholar returned no papers; keeping the existing bibliography.')
 result={key(p['title']):copy.deepcopy(p) for p in existing['publications']}
 overrides={key(k):v for k,v in editorial.get('overrides',{}).items()}
 excluded={key(t) for t in editorial.get('exclude',[])}
 seen=set()
 for item in incoming:
  bib=item.get('bib',{});title=str(bib.get('title','')).strip();k=key(title)
  if not k: raise ValueError('Missing publication title; refresh aborted.')
  if k in excluded or k in seen: continue
  seen.add(k)
  prev=result.get(k,{})
  year=bib.get('pub_year') or prev.get('year')
  if not str(year).isdigit(): raise ValueError(f'Missing/invalid publication year for {title}')
  raw_authors=bib.get('author',[])
  authors=raw_authors.split(' and ') if isinstance(raw_authors,str) else raw_authors
  authors=[a.strip() for a in authors if isinstance(a,str) and a.strip()]
  if not authors: authors=prev.get('authors',[])
  if not authors: raise ValueError(f'Missing authors for {title}')
  url=item.get('pub_url','')
  links=copy.deepcopy(prev.get('links',{}))
  if safe_url(url) and not links: links['Paper']=url
  if not links: raise ValueError(f'Missing valid paper URL for {title}')
  venue=bib.get('journal') or bib.get('conference') or prev.get('venue','')
  publication={**prev,'id':prev.get('id','paper-'+hashlib.sha256(k.encode()).hexdigest()[:12]),'title':prev.get('title',title),'authors':authors,'year':int(year),'venue':venue,'links':links,'type':prev.get('type','Publication'),'selected':prev.get('selected',False),'description':prev.get('description',''),'image':prev.get('image','')}
  publication.update(overrides.get(k,{}))
  result[k]=publication
 for k,p in result.items(): p.update(overrides.get(k,{}))
 papers=[p for k,p in result.items() if k not in excluded]
 papers.sort(key=lambda p:(-int(p['year']),p['title'].casefold()))
 return {**existing,'publications':papers}
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--fixture',type=Path,help='Offline Scholar-shaped JSON for verification');args=parser.parse_args()
 path=ROOT/'content/publications.json';existing=json.loads(path.read_text());editorial=json.loads((ROOT/'content/publication_overrides.json').read_text())
 if args.fixture: incoming=json.loads(args.fixture.read_text())
 else:
  from scholarly import scholarly
  scholarly.set_timeout(30)
  scholarly.set_retries(2)
  author=scholarly.fill(scholarly.search_author_id(AUTHOR_ID),sections=['publications'])
  incoming=[scholarly.fill(p) for p in author['publications']]
 updated=merge(existing,incoming,editorial)
 # A successful source check is recorded even when there are no new papers.
 updated['last_scholar_sync']=datetime.now(timezone.utc).isoformat()
 temporary=path.with_suffix('.tmp');temporary.write_text(json.dumps(updated,ensure_ascii=False,indent=2)+'\n');temporary.replace(path)
 print(f'Refreshed {len(updated["publications"])} publications from Google Scholar.')
if __name__=='__main__':main()
