// Helpers
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>[...document.querySelectorAll(s)];
const clamp = (n,min,max)=>Math.max(min,Math.min(n,max));

// Year
const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();

// Mobile nav
document.getElementById('navToggle')?.addEventListener('click', ()=>{
  const nav = document.querySelector('.nav');
  if(!nav) return;
  nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
});

// Smooth nav + active highlight
const navEl = document.getElementById('mainNav');
if(navEl){
  navEl.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-target]'); if(!a) return;
    e.preventDefault();
    document.getElementById(a.dataset.target)?.scrollIntoView({behavior:'smooth'});
  });
  const sections = ['home','portfolio','about','services','packages','contact'].map(id=>document.getElementById(id));
  const onScroll = ()=>{
    const y = window.scrollY + 140;
    for(const sec of sections){
      if(!sec) continue;
      const top = sec.offsetTop, bottom = top + sec.offsetHeight;
      if(y>=top && y<bottom){
        $$('#mainNav a').forEach(n=>n.classList.toggle('active', n.dataset.target === sec.id));
        break;
      }
    }
  };
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
}

// Starfield
(function(){
  const canvas = document.getElementById('starfield'); if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w,h,stars=[]; const COUNT=220;
  function resize(){ w = canvas.width = innerWidth; h = canvas.height = innerHeight; }
  function init(){ resize(); stars = Array.from({length:COUNT}, ()=>({x:Math.random()*w,y:Math.random()*h,z:Math.random()*1+0.3,s:Math.random()*1.2+0.2})); }
  function tick(){
    ctx.clearRect(0,0,w,h);
    for(const st of stars){
      st.x += st.z*0.35; st.y += st.z*0.12;
      if(st.x>w||st.y>h){ st.x = Math.random()*w*0.25; st.y = 0; st.z = Math.random()*1+0.3; }
      ctx.globalAlpha = 0.55 + st.z*0.4;
      ctx.fillStyle = '#eaf4fa';
      ctx.fillRect(st.x, st.y, st.s, st.s);
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', resize);
  init(); tick();
})();

// Parallax
(function(){
  const layers = $$('.p-layer'); if(!layers.length) return;
  document.addEventListener('mousemove', (e)=>{
    const x = (e.clientX / innerWidth - 0.5);
    const y = (e.clientY / innerHeight - 0.5);
    layers.forEach((el,i)=>{
      const d = (i+1)*6;
      el.style.transform = `translate(${(-x*d).toFixed(2)}px, ${(-y*d).toFixed(2)}px)`;
    });
  });
})();

// Top logo fade on scroll
(function(){
  const logo = document.getElementById('topLogo'); if(!logo) return;
  function update(){
    const fadeStart = 0;            // at top
    const fadeEnd = innerHeight*0.5; // halfway through first viewport
    const sc = clamp((window.scrollY - fadeStart)/(fadeEnd-fadeStart), 0, 1);
    const opacity = 1 - sc;
    logo.style.setProperty('--logoOpacity', opacity.toFixed(3));
  }
  update();
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
})();

// Logo shimmer only once on load (class is already present; we remove after it runs)
(function(){
  const el = document.querySelector('.shimmer-once');
  if(!el) return;
  setTimeout(()=> el.classList.remove('shimmer-once'), 2200);
})();

// Section quick links
$$('[data-goto]').forEach(btn=>btn.addEventListener('click', (e)=>{
  const id = e.currentTarget.dataset.goto;
  document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
}));

// Portfolio stories modal
(function(){
  const modal = document.getElementById('storyModal'); if(!modal) return;
  const title = document.getElementById('storyTitle'); const body = document.getElementById('storyBody');
  document.querySelectorAll('.btn.tiny[data-story]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const [t,b] = btn.dataset.story.split('|');
      title.textContent = t; body.textContent = b;
      modal.classList.add('show');
    });
  });
  document.getElementById('closeModal')?.addEventListener('click', ()=> modal.classList.remove('show'));
  modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.classList.remove('show'); });
})();

// Quote calculator (USD)
(function(){
  const serviceSel = document.getElementById('service');
  const pagesInput = document.getElementById('pages');
  const quoteEl = document.getElementById('quote');
  function calc(){
    if(!quoteEl) return;
    let q = 0;
    const svc = serviceSel?.value;
    const pages = parseInt(pagesInput?.value || '0', 10) || 0;
    if(svc === 'web'){ q = (pages > 0 ? pages : 1) * 100; }
    else if(svc === 'logo'){ q = 299; }
    else if(svc === 'app'){ q = 2000; }
    else if(svc === 'marketing'){ q = 399; }
    else if(svc === 'integrations'){ q = 250; }
    quoteEl.textContent = `$${q.toLocaleString()} USD`;
  }
  serviceSel && serviceSel.addEventListener('change', calc);
  pagesInput && pagesInput.addEventListener('input', calc);
  calc();
})();

// Ambient sound (muted by default) — WebAudio oscillator for lightweight hum
(function(){
  let ctx, gain, isOn = false;
  const btn = document.getElementById('soundToggle'); if(!btn) return;
  btn.classList.add('muted'); // start muted
  btn.title = 'Ambient hum (muted)';
  function ensure(){
    if(ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    gain = ctx.createGain();
    const filt = ctx.createBiquadFilter();
    osc.type = 'sine';  osc.frequency.value = 80;   // base hum
    osc2.type = 'sine'; osc2.frequency.value = 160; // gentle overtone
    filt.type = 'lowpass'; filt.frequency.value = 800;
    gain.gain.value = 0.0; // start silent
    osc.connect(filt); osc2.connect(filt);
    filt.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc2.start();
  }
  function setOn(v){
    isOn = v;
    if(v){
      ensure();
      btn.classList.remove('muted');
      btn.title = 'Ambient hum (on)';
      // fade in
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.6);
    }else if(ctx && gain){
      btn.classList.add('muted');
      btn.title = 'Ambient hum (muted)';
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.0, now + 0.4);
    }
  }
  btn.addEventListener('click', ()=> setOn(!isOn));
})();

// Stripe purchase buttons (client side -> server endpoint)
document.querySelectorAll('.purchase').forEach(btn=>{
  btn.addEventListener('click', async (e)=>{
    const plan = e.currentTarget.dataset.plan;
    try{
      const res = await fetch('/create-checkout-session', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({plan})
      });
      const data = await res.json();
      if(data.sessionId){
        const stripe = Stripe(data.publishableKey || 'pk_test_PLACEHOLDER');
        stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        alert(data.error || 'Checkout session failed.');
      }
    }catch(err){
      console.error(err); alert('Network error creating checkout session.');
    }
  });
});

// Contact -> mailto
document.getElementById('sendBtn')?.addEventListener('click', ()=>{
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const msg = document.getElementById('msg').value.trim();
  if(!name || !email || !msg){ alert('Please complete the form.'); return; }
  const subject = encodeURIComponent('Quote request from ' + name);
  const body = encodeURIComponent(msg + '\n\nService: ' + (document.getElementById('service')?.value||'') + '\nPages: ' + (document.getElementById('pages')?.value||'') + '\nContact: ' + email);
  window.location.href = `mailto:you@yourdomain.com?subject=${subject}&body=${body}`;
});

// CTA scroll
document.getElementById('hireTop')?.addEventListener('click', ()=>{
  document.getElementById('contact')?.scrollIntoView({behavior:'smooth'});
});
document.getElementById('floatingHire')?.addEventListener('click', ()=>{
  document.getElementById('contact')?.scrollIntoView({behavior:'smooth'});
});
