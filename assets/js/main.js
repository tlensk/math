/* Lightweight progressive enhancement: theme, mobile navigation, filters, diagram. */
(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const saved = (() => { try { return localStorage.getItem('tl-theme'); } catch (_) { return null; } })();
  const preferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = saved === 'light' || saved === 'dark' ? saved : preferred;

  function setTheme(value) {
    root.dataset.theme = value;
    if (themeButton) {
      themeButton.setAttribute('aria-label', value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      themeButton.title = value === 'dark' ? 'Light theme' : 'Dark theme';
    }
  }
  setTheme(theme);
  themeButton?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('tl-theme', next); } catch (_) { /* private browsing */ }
  });

  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  function closeMenu() {
    nav?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation');
  }
  menuButton?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closeMenu(); });

  const year = document.getElementById('copyright-year');
  if (year) year.textContent = String(new Date().getFullYear());
  document.getElementById('print-cv')?.addEventListener('click', () => window.print());

  // The publication filters are controls for browsing a static bibliography.
  const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
  const publications = Array.from(document.querySelectorAll('.publication'));
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(b => {
      const active = b === button;
      b.classList.toggle('is-selected', active);
      b.setAttribute('aria-pressed', String(active));
    });
    let count = 0;
    publications.forEach(item => {
      const show = filter === 'all' || item.dataset.topic === filter;
      item.hidden = !show;
      if (show) count++;
    });
    const label = document.getElementById('filter-count');
    if (label) label.textContent = count + ' selected publication' + (count === 1 ? '' : 's');
  }));

  // Conceptual structure diagram: illustrative relationships, not empirical data.
  const svg = document.getElementById('structure-diagram');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const lines = document.getElementById('diagram-lines');
  const dots = document.getElementById('diagram-nodes');
  const labels = document.getElementById('diagram-annotations');
  const groups = [
    [[105,108],[144,78],[165,127],[112,162],[176,175],[78,130],[203,97]],
    [[310,93],[358,115],[398,80],[428,146],[346,176],[285,160],[385,198]],
    [[161,273],[216,245],[235,306],[188,352],[115,333],[265,358],[131,236]]
  ];
  const nodes = groups.flat().map(([x,y],i)=>({x,y,i,group:Math.floor(i/7)}));
  const links = [];
  groups.forEach((group,g) => {
    const base = g * 7;
    // A reproducible connected subgraph with a few redundant connections.
    [[0,1],[0,3],[0,5],[1,2],[1,6],[2,4],[2,6],[3,4],[3,5],[4,6]].forEach(([a,b]) => links.push({a:base+a,b:base+b,intra:true}));
  });
  [[2,12],[4,14],[10,17],[6,13],[18,9]].forEach(([a,b]) => links.push({a,b,intra:false}));
  function el(name,attrs={},parent=null) {
    const item = document.createElementNS(NS,name);
    Object.entries(attrs).forEach(([k,v])=>item.setAttribute(k,String(v)));
    parent?.appendChild(item);
    return item;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function writeLabel(x,y,words) { const t=el('text',{x,y,class:'diagram-text'},labels);t.textContent=words; }
  function render(mode) {
    clear(lines); clear(dots); clear(labels);
    if (mode === 'structure') {
      nodes.forEach((n,i)=>{ if(i%7===0)el('circle',{cx:n.x,cy:n.y,r:77,class:'diagram-halo'},lines); });
      links.forEach(link=>{const a=nodes[link.a],b=nodes[link.b];el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'diagram-edge '+(link.intra?'':'faint')},lines);});
      nodes.forEach(n=>el('circle',{cx:n.x,cy:n.y,r:n.i%7===0?7:4.5,class:'diagram-node'+(n.i%7===0?' active':'')},dots));
      writeLabel(60,43,'LOCAL RELATIONSHIPS'); writeLabel(297,228,'MODULAR STRUCTURE');
    } else if (mode === 'learning') {
      links.forEach(link=>{const a=nodes[link.a],b=nodes[link.b];el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'diagram-edge '+(link.intra?'':'faint')},lines);});
      const selected = new Set([1,2,4,8,10,12,14,16,18,20]);
      nodes.forEach(n=>el('circle',{cx:n.x,cy:n.y,r:selected.has(n.i)?7:3.7,class:'diagram-node'+(selected.has(n.i)?' active':' faint')},dots));
      el('path',{d:'M 260 382 Q 315 383 358 354',fill:'none',stroke:'var(--accent)','stroke-width':'2','stroke-dasharray':'5 6'},labels);
      writeLabel(54,43,'OBSERVED INPUT');writeLabel(331,390,'LEARNED FEATURES');
      [0,1,2].forEach((g)=>{el('rect',{x:344+g*30,y:300-g*12,width:24,height:24,rx:2,class:'diagram-box'},labels);});
    } else {
      // Matched and unmatched features emphasize evaluation against known structure.
      links.filter(l=>l.intra).forEach(link=>{const a=nodes[link.a],b=nodes[link.b];el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'diagram-edge faint'},lines);});
      const matched = new Set([0,1,2,3,7,8,9,10,14,15,16,17]);
      nodes.forEach(n=>el('circle',{cx:n.x,cy:n.y,r:matched.has(n.i)?6:3.8,class:'diagram-node'+(matched.has(n.i)?' active':' faint')},dots));
      [[0,1],[1,2],[7,8],[8,9],[14,15],[15,16]].forEach(([a,b])=>{const n=nodes[a],m=nodes[b];el('line',{x1:n.x,y1:n.y,x2:m.x,y2:m.y,class:'diagram-edge strong'},lines)});
      writeLabel(56,42,'KNOWN STRUCTURE');writeLabel(308,386,'RECOVERED / TESTED');
      el('rect',{x:300,y:230,width:170,height:98,rx:4,class:'diagram-box'},labels);
      [0,1,2].forEach((i)=>{const a=el('circle',{cx:324+i*50,cy:279,r:6,class:'diagram-node active'},labels);});
    }
    const descriptions = {
      structure: 'Underlying relationships form modules and hierarchies.',
      learning: 'A model may learn only a subset of the available structure.',
      validation: 'Recovered features can be tested against known structure.'
    };
    const caption=document.getElementById('diagram-caption');
    if(caption) caption.textContent=descriptions[mode];
    document.querySelectorAll('.mode-button').forEach(b=>{
      const active = b.dataset.mode === mode;
      b.classList.toggle('is-active',active);
      b.setAttribute('aria-pressed',String(active));
    });
  }
  document.querySelectorAll('.mode-button').forEach(b=>b.addEventListener('click',()=>render(b.dataset.mode)));
  render('structure');
})();
