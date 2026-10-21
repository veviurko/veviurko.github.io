"""Dependency-free static site builder. Edit content/*.json, then run this file."""
from pathlib import Path
import json, html, shutil, hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist'
S=json.loads((ROOT/'content/site.json').read_text())
P=json.loads((ROOT/'content/publications.json').read_text())
BASE_URL='https://veviurko.github.io/'
e=lambda x: html.escape(str(x),quote=True)
def link(label,url,cls=''):
 if not str(url).startswith(('https://','http://','mailto:','#','assets/')): raise ValueError('Unsafe URL: '+str(url))
 return f'<a class="{cls}" href="{e(url)}">{e(label)}</a>'
def profiles():
 return ''.join(link(k+' ↗',v) for k,v in S['profiles'].items())
def paper(p):
 authors=', '.join('<strong>'+e(a)+'</strong>' if a=='Grigorii Veviurko' else e(a) for a in p['authors'])
 image=f'<img class="paper-image" src="{e(p["image"])}" alt="" loading="lazy">' if p.get('image') else ''
 description=f'<p>{e(p["description"])}</p>' if p.get('description') else ''
 return f'''<article class="paper" data-type="{e(p['type'])}" data-search="{e((p['title']+' '+' '.join(p['authors'])+' '+p['venue']+' '+str(p['year'])).lower())}">
 <div class="paper-year">{e(p['year'])}</div><div class="paper-body">{image}<div class="paper-meta">{e(p['venue'] or p['type'])} <span> / {e(p['type'])}</span></div>
 <h3>{link(p['title'],next(iter(p['links'].values())))}</h3><p class="authors">{authors}</p>{description}<div class="paper-links">{''.join(link(k+' ↗',v) for k,v in p['links'].items())}</div></div></article>'''
def heading(kicker,title,desc=''):
 return f'<header class="page-heading"><p class="eyebrow">{e(kicker)}</p><h1>{e(title)}</h1>{"<p>"+e(desc)+"</p>" if desc else ""}</header>'
def shell(page,title,body):
 version=hashlib.sha256((ROOT/'static/assets/style.css').read_bytes()+(ROOT/'static/assets/main.js').read_bytes()).hexdigest()[:10]
 metadata={
  'Home': ('', 'Grigorii Veviurko | Machine Learning Engineer, PhD', 'Grigorii Veviurko is a machine learning engineer at Apple in Munich and a TU Delft PhD graduate. Explore his publications, past research and experience.'),
  'Past research': ('research.html', 'Past Research | Grigorii Veviurko', 'Past research by Grigorii Veviurko in reinforcement learning, constrained optimization, decision-focused learning and naked mole-rat vocalizations.'),
  'About': ('about.html', 'About Grigorii Veviurko | Experience & Education', 'Grigorii Veviurko’s background: machine learning at Apple, a PhD from TU Delft, research at Nokia Bell Labs and computational neuroscience in Berlin.')
 }
 route,seo_title,description=metadata.get(page,('',title+' | '+S['name'],S['intro']))
 canonical=BASE_URL+route
 seo=(f'<link rel="canonical" href="{canonical}"><meta property="og:type" content="website"><meta property="og:url" content="{canonical}"><meta property="og:title" content="{e(seo_title)}"><meta property="og:description" content="{e(description)}"><meta property="og:image" content="{BASE_URL}assets/portrait.jpg"><meta name="twitter:card" content="summary">') if page in metadata else '<meta name="robots" content="noindex">'
 if S.get('google_site_verification'):
  seo+=f'<meta name="google-site-verification" content="{e(S["google_site_verification"])}">'
 if page=='Home':
  person={'@context':'https://schema.org','@type':'Person','@id':BASE_URL+'#person','name':S['name'],'url':BASE_URL,'image':BASE_URL+'assets/portrait.jpg','jobTitle':S['role'],'sameAs':list(S['profiles'].values()),'alumniOf':[{'@type':'CollegeOrUniversity','name':x['institution']} for x in S['education']]}
  seo+='<script type="application/ld+json">'+json.dumps(person,ensure_ascii=False).replace('<','\\u003c')+'</script>'
 nav=''.join(f'<a href="{url}"'+(' aria-current="page"' if page==name else '')+f'>{name}</a>' for name,url in [('Home','index.html'),('Past research','research.html'),('About','about.html')])
 return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{e(seo_title)}</title><meta name="description" content="{e(description)}">{seo}<meta name="theme-color" content="#f7f8f4"><link rel="icon" href="assets/favicon.svg?v={version}" type="image/svg+xml"><link rel="stylesheet" href="assets/style.css?v={version}"><script src="assets/main.js?v={version}" defer></script></head><body>
 <a class="skip" href="#main">Skip to content</a><div class="site-wrap"><header class="site-header"><a class="wordmark" href="index.html" aria-label="Grigorii Veviurko, home"><img src="assets/marks/gv-4.svg" alt="" width="56" height="56"></a><nav aria-label="Main navigation">{nav}<a class="cv-link" href="assets/cv.pdf">CV <span aria-hidden="true">↗</span></a></nav></header>
 <main id="main">{body}</main><footer id="contact"><div><p class="eyebrow">Get in touch</p><a class="email" href="mailto:{e(S['email'])}">{e(S['email'])} <span aria-hidden="true">↗</span></a></div><div class="footer-right"><div class="profile-links">{profiles()}</div><p>{e(S['name'])} · {e(S['location'])}</p></div></footer></div></body></html>'''
def timeline(items):
 result=''
 for x in items:
  thesis=''
  if x.get('thesis'):
   thesis='<p class="thesis">Thesis: '+(link(x['thesis']+' ↗',x['url']) if x.get('url') else e(x['thesis']))+'</p>'
  detail=''.join('<p>'+e(paragraph)+'</p>' for paragraph in x.get('paragraphs',[]))
  references='<div class="paper-links">'+''.join(link(label+' ↗',url) for label,url in x.get('links',{}).items())+'</div>' if x.get('links') else ''
  result+=f'<article class="timeline-row"><p class="dates">{e(x["dates"])}</p><div class="institution-logo"><img src="{e(x["logo"])}" alt="{e(x["institution"])} logo" loading="lazy"></div><div><h3>{e(x["institution"])}</h3><p class="role">{e(x["role"])}</p><p class="muted">{e(x["location"])}</p>{thesis}'+(f'<p>{e(x["description"])}</p>' if x.get('description') else '')+'<div class="experience-description">'+detail+'</div>'+references+'</div></article>'
 return result

def replay_visual(caption):
 frames=json.loads((ROOT/'static/assets/research/safe-rl-motion.json').read_text())
 first=frames[0]
 obstacles=''.join(f'<circle data-obstacle="{i}" cx="{x}" cy="{y}" r="{radius}"/>' for i,(x,y,radius) in enumerate(first['obstacles']))
 ax,ay=first['agent'];gx,gy=first['goal']
 return f'''<figure class="research-visual rl-replay" data-motion="assets/research/safe-rl-motion.json"><div class="replay-header"><p class="eyebrow">Navigating moving obstacles</p><span class="replay-time">0.0 s</span></div><svg class="replay-arena" viewBox="80 75 560 560" role="img" aria-label="Agent moving toward a goal while avoiding three moving obstacles"><rect x="89" y="85" width="541" height="539" rx="18" fill="#f5f2ed"/><rect x="165" y="161" width="388" height="386" fill="#fffdf9" stroke="#ad9dbd" stroke-width="2"/><circle class="replay-goal" cx="{gx}" cy="{gy}" r="73" fill="#dcebdc" fill-opacity=".65" stroke="#6d9477" stroke-width="2" stroke-dasharray="5 5"/><g fill="#bc8c78" fill-opacity=".65" stroke="#a77763" stroke-width="1.5">{obstacles}</g><polyline class="replay-trail" fill="none" stroke="#684597" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/><circle class="replay-agent" cx="{ax}" cy="{ay}" r="8" fill="#684597" stroke="white" stroke-width="2.5"/></svg><div class="replay-legend"><span><i class="agent-key"></i>Agent</span><span><i class="goal-key"></i>Goal region</span><span><i class="obstacle-key"></i>Obstacles</span></div><div class="replay-controls"><button type="button" class="replay-play" aria-pressed="false">Play</button><label class="sr-only" for="rl-progress">Animation progress</label><input id="rl-progress" type="range" min="0" max="249" value="0" step="1"><button class="replay-reset" type="button" aria-label="Restart animation">↺</button></div><figcaption>{e(caption)}</figcaption></figure>'''

def build():
 OUT.mkdir(exist_ok=True);shutil.copytree(ROOT/'static',OUT,dirs_exist_ok=True)
 (OUT/'assets/publications.json').write_text(json.dumps(P,ensure_ascii=False,indent=2)+'\n')
 papers=sorted(P['publications'],key=lambda x:-int(x['year']))
 research=''.join(f'<a class="research-link" href="research.html#{e(r["id"])}"><span>{e(r["title"])}</span><span aria-hidden="true">↗</span></a>' for r in S['research'])
 journey=''.join(f'<a class="journey-item" href="about.html"><img src="{e(x["logo"])}" alt=""><span>{e(label)}</span></a>' for x,label in [(S['experience'][0],'Apple'),(S['experience'][1],'Nokia Bell Labs'),(S['experience'][3],'MDC Berlin'),(S['education'][0],'TU Delft'),(S['education'][1],'TU Berlin'),(S['education'][2],'HSE')])
 body=f'''<section class="hero"><div class="hero-copy"><p class="eyebrow">Machine learning · Engineering</p><h1>Grigorii<br>Veviurko<span class="name-dot">.</span></h1><p class="position">{e(S['role'])} at <strong>{e(S['affiliation'])}</strong><span class="location">{e(S['location'])}</span></p><p class="degree-line"><a href="about.html#education">{e(S['degree_line'])} <span aria-hidden="true">↗</span></a></p><p class="intro">{e(S['intro'])}</p>{'<p class="intro">'+e(S['intro_more'])+'</p>' if S['intro_more'] else ''}<div class="profile-links">{profiles()}{link('Email ↗','mailto:'+S['email'])}</div></div><figure class="portrait"><img src="assets/portrait.jpg" width="521" height="544" alt="Portrait of Grigorii Veviurko"><figcaption>Grigorii Veviurko <span>Munich, DE</span></figcaption></figure></section>
 <section class="journey" aria-label="Education and experience"><p class="eyebrow">Along the way</p><div>{journey}</div></section>
 <section class="research-strip" aria-labelledby="research-heading"><h2 class="eyebrow" id="research-heading">Research background</h2><div>{research}</div></section>
 <section class="selected" id="publications"><div class="section-heading"><div><p class="eyebrow">Papers & dissertation</p><h2>Publications</h2></div></div>{''.join(paper(p) for p in papers)}</section>
'''
 (OUT/'index.html').write_text(shell('Home','Home',body))
 (OUT/'publications.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=index.html#publications"><title>Publications</title><a href="index.html#publications">Publications on the homepage</a></html>')
 sections=''
 for i,r in enumerate(S['research'],1):
  related=[p for p in papers if p['id'] in r['papers']]
  prose=''.join('<p>'+e(paragraph)+'</p>' for paragraph in r.get('paragraphs',[]))
  if not prose: prose='<p>'+e(r['description'])+'</p>' if r['description'] else '<p class="placeholder">Description to follow.</p>'
  extra_links='<div class="research-extra-links">'+''.join(link(label+' ↗',url) for label,url in r.get('links',{}).items())+'</div>' if r.get('links') else ''
  visuals=''
  for v in r.get('visuals',[]):
   if v.get('kind')=='geometry':
    panels=[('interior','No active constraints','Free to move'),('edge','One active constraint','Can slide along the edge'),('corner','Two active constraints','Can remain pinned at the corner')]
    visuals+='<figure class="research-visual geometry-figure"><div class="geometry-panels">'+''.join(f'<div><p class="geometry-label">{e(title)}</p><img src="assets/research/geometry-{key}.png" alt="{e(title+": "+desc)}" loading="lazy"><p>{e(desc)}</p></div>' for key,title,desc in panels)+'</div><figcaption>'+e(v['caption'])+'</figcaption></figure>'
    continue
   if v.get('kind')=='replay':
    visuals+=replay_visual(v['caption'])
    continue
   image=f'<img src="{e(v.get("poster",v["src"]))}" alt="{e(v["alt"])}" loading="lazy">'
   if v.get('animated'): image=f'<button class="animation-toggle" type="button" data-animation="{e(v["src"])}" data-poster="{e(v["poster"])}" aria-pressed="false">{image}<span>Play demonstration ↗</span></button>'
   visuals+=f'<figure class="research-visual">{image}<figcaption>{e(v["caption"])}</figcaption></figure>'
  aliases=''.join('<span id="'+e(a)+'"></span>' for a in r.get('aliases',[]))
  if r.get('visuals_after'):
   parts=r['paragraphs'];cut=r['visuals_after'];prose=''.join('<p>'+e(x)+'</p>' for x in parts[:cut])+visuals+''.join('<p>'+e(x)+'</p>' for x in parts[cut:]);visuals=''
  sections+=aliases+f'<section class="research-section" id="{e(r["id"])}"><div class="research-number">0{i}</div><div><p class="eyebrow">{e(r["subtitle"])}</p><h2>{e(r["title"])}</h2>'+'<div class="research-description">'+prose+'</div>'+visuals+('<ul class="related-papers">'+''.join('<li>'+link(p['title']+' ↗',next(iter(p['links'].values())))+'</li>' for p in related)+'</ul>' if related else '')+extra_links+'</div></section>'
 projects=''
 if S['projects']:
  projects='<section><h2>Projects</h2>'+''.join('<h3>'+e(p['title'])+'</h3><p>'+e(p.get('description',''))+'</p>'+link('Project ↗',p['url']) for p in S['projects'])+'</section>'
 (OUT/'research.html').write_text(shell('Past research','Past research',heading('Research background','Past research','Research from my PhD and earlier work in computational neuroscience.')+'<nav class="research-contents" aria-label="Research topics">'+''.join('<a href="#'+e(r['id'])+'">'+e(r['title'])+' <span aria-hidden="true">↓</span></a>' for r in S['research'])+'</nav>'+sections+projects))
 extra=''.join('<section class="about-section"><h2>'+title+'</h2><p>'+e(S[key])+'</p></section>' for key,title in [('about_more','About me'),('personal_interests','Personal interests'),('research_philosophy','Research philosophy')] if S[key])
 body=heading('Background','About',S['intro'])+extra+'<section class="about-section"><div class="section-heading"><h2>Experience</h2><a class="text-link" href="assets/cv.pdf">Download CV ↗</a></div>'+timeline(S['experience'])+'</section><section class="about-section" id="education"><h2>Education</h2>'+timeline(S['education'])+'</section>'
 (OUT/'about.html').write_text(shell('About','About',body))
 # Preserve old bookmarks without keeping duplicate, outdated page content.
 (OUT/'pages').mkdir(exist_ok=True)
 for old,new in [('publications.html','index.html#publications'),('blog.html','index.html'),('post.html','index.html')]:
  (OUT/'pages'/old).write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../{new}"><title>Page moved</title><p><a href="../{new}">Continue to the updated website</a></p></html>')
 (OUT/'404.html').write_text(shell('','Page not found',heading('404','Page not found')+'<p><a href="index.html">Return to the homepage ↗</a></p>'))
 (OUT/'robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: '+BASE_URL+'sitemap.xml\n')
 (OUT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+BASE_URL+route+'</loc></url>' for route in ['', 'research.html', 'about.html'])+'</urlset>\n')
 (OUT/'.nojekyll').touch()
 print('Built 3 pages, legacy redirects, and 404 page in dist/')
if __name__=='__main__':build()
