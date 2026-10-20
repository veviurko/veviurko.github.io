from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
ROOT=Path(__file__).resolve().parents[1]/'dist'
class Links(HTMLParser):
 def __init__(self): super().__init__();self.urls=[];self.ids=[]
 def handle_starttag(self,tag,attrs):
  data=dict(attrs)
  if 'id' in data:self.ids.append(data['id'])
  if tag=='a' and 'href' in data:self.urls.append(data['href'])
  if tag in ['img','script'] and 'src' in data:self.urls.append(data['src'])
  if tag=='link' and 'href' in data:self.urls.append(data['href'])
errors=[]
for file in ROOT.rglob('*.html'):
 parser=Links();parser.feed(file.read_text())
 if len(parser.ids)!=len(set(parser.ids)):errors.append(f'Duplicate IDs: {file}')
 for url in parser.urls:
  u=urlparse(url)
  if u.scheme or u.netloc:continue
  target=(file.parent/unquote(u.path)).resolve() if u.path else file
  if not target.exists():errors.append(f'Broken link in {file.name}: {url}')
  elif u.fragment and target.suffix=='.html':
   dest=Links();dest.feed(target.read_text())
   if u.fragment not in dest.ids:errors.append(f'Missing anchor: {url}')
if errors:raise SystemExit('\n'.join(errors))
print('All local links, assets, IDs and anchors valid.')
