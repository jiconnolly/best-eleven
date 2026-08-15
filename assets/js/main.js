/* BESG site — shared behavior */
(function(){
  document.documentElement.classList.remove('no-js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced) document.documentElement.classList.add('reduced');

  /* ---------- Language toggle ----------
     Every translatable element carries data-es (text) or data-es-html.
     English content lives in the markup; first switch caches it. */
  function setLang(lang, persist){
    document.documentElement.lang = lang === 'es' ? 'es' : 'en';
    document.querySelectorAll('[data-es],[data-es-html]').forEach(function(elm){
      var htmlMode = elm.hasAttribute('data-es-html');
      if(htmlMode){
        if(!elm.dataset.enHtml) elm.dataset.enHtml = elm.innerHTML;
        elm.innerHTML = lang === 'es' ? elm.dataset.esHtml : elm.dataset.enHtml;
      } else {
        if(!('en' in elm.dataset)) elm.dataset.en = elm.textContent;
        elm.textContent = lang === 'es' ? elm.dataset.es : elm.dataset.en;
      }
    });
    document.querySelectorAll('.lang-toggle button').forEach(function(b){
      b.classList.toggle('on', b.dataset.lang === lang);
    });
    if(persist){ try{ localStorage.setItem('besg-lang', lang); }catch(e){} }
  }
  // stash data-es-html originals before first swap
  document.querySelectorAll('[data-es-html]').forEach(function(elm){
    elm.dataset.esHtml = elm.getAttribute('data-es-html');
  });
  document.querySelectorAll('.lang-toggle button').forEach(function(b){
    b.addEventListener('click', function(){ setLang(b.dataset.lang, true); });
  });
  var saved = 'en';
  try{ saved = localStorage.getItem('besg-lang') || 'en'; }catch(e){}
  if(saved === 'es') setLang('es', false);
  else document.querySelectorAll('.lang-toggle button[data-lang="en"]').forEach(function(b){ b.classList.add('on'); });

  /* ---------- Nav ---------- */
  var nav = document.querySelector('.nav');
  function onScroll(){ nav && nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  var burger = document.querySelector('.burger');
  var links = document.querySelector('.nav-links');
  if(burger && links){
    burger.addEventListener('click', function(){
      burger.classList.toggle('open');
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        burger.classList.remove('open'); links.classList.remove('open');
      });
    });
  }

  // active link
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function(a){
    if(a.getAttribute('href') === page) a.classList.add('active');
  });

  /* ---------- Page transition veil ---------- */
  var veil = document.createElement('div');
  veil.id = 'veil';
  document.body.appendChild(veil);
  if(!reduced){
    document.querySelectorAll('a[href$=".html"]').forEach(function(a){
      if(a.host && a.host !== location.host) return;
      a.addEventListener('click', function(e){
        var href = a.getAttribute('href');
        if(!href || href.indexOf('#') === 0) return;
        e.preventDefault();
        veil.classList.add('on');
        setTimeout(function(){ location.href = href; }, 380);
      });
    });
    window.addEventListener('pageshow', function(){ veil.classList.remove('on'); });
  }

  /* ---------- Cursor-tracked 3D tilt ----------
     Feeds --rx/--ry (card rotation) and --mx/--my (spotlight position) to any
     .tilt element. Skipped without a fine pointer, so touch keeps the plain
     CSS lift and never gets a tilt stuck on after a tap. */
  if(!reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    var MAX_TILT = 9;
    document.querySelectorAll('.tilt').forEach(function(el){
      var raf = 0, rx = 0, ry = 0, mx = 50, my = 50;
      function paint(){
        raf = 0;
        el.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        el.style.setProperty('--ry', ry.toFixed(2) + 'deg');
        el.style.setProperty('--mx', mx.toFixed(1) + '%');
        el.style.setProperty('--my', my.toFixed(1) + '%');
      }
      function schedule(){ if(!raf) raf = requestAnimationFrame(paint); }
      el.addEventListener('pointermove', function(e){
        if(e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        if(!r.width || !r.height) return;
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        mx = px * 100; my = py * 100;
        ry = (px - 0.5) * 2 * MAX_TILT;
        rx = -(py - 0.5) * 2 * MAX_TILT;
        schedule();
      });
      function rest(){ rx = ry = 0; mx = my = 50; schedule(); }
      el.addEventListener('pointerleave', rest);
      el.addEventListener('pointercancel', rest);
      el.addEventListener('blur', rest);
    });
  }

  /* ---------- GSAP reveals ---------- */
  if(typeof gsap !== 'undefined' && !reduced){
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.reveal').forEach(function(elm){
      gsap.to(elm, {
        opacity: 1, y: 0, duration: 1.05, ease: 'power3.out',
        delay: parseFloat(elm.dataset.delay || 0),
        scrollTrigger: { trigger: elm, start: 'top 88%' }
      });
    });

    // hero intro sequence (home only) — waits for gate entry if the gate is present
    if(document.querySelector('.hero-copy')){
      gsap.set('.hero-copy h1', {y:26});
      var playIntro = function(){
        var tl = gsap.timeline({defaults:{ease:'power3.out'}});
        tl.to('.hero-copy .eyebrow', {opacity:1, duration:0.8}, 0.15)
          .to('.hero-copy h1', {opacity:1, y:0, duration:1.1}, 0.3)
          .to('.hero-copy .lead', {opacity:1, duration:1}, 0.75)
          .to('.hero-ctas', {opacity:1, duration:0.9}, 1.0)
          .to('.hstat', {opacity:1, duration:0.8, stagger:0.12}, 1.15);
      };
      if(document.getElementById('gate')){
        document.addEventListener('besg:enter', playIntro, {once:true});
      } else {
        playIntro();
      }
    }

    // counters
    document.querySelectorAll('[data-count]').forEach(function(elm){
      var end = parseFloat(elm.dataset.count);
      var dec = elm.dataset.dec ? parseInt(elm.dataset.dec) : 0;
      var obj = {v:0};
      gsap.to(obj, {
        v: end, duration: 1.8, ease: 'power2.out',
        scrollTrigger: {trigger: elm, start: 'top 90%'},
        onUpdate: function(){
          elm.textContent = obj.v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
      });
    });

    // gentle parallax on plates
    document.querySelectorAll('.plate img').forEach(function(im){
      gsap.fromTo(im, {y:-14}, {
        y: 14, ease: 'none',
        scrollTrigger: {trigger: im, scrub: 0.6, start: 'top bottom', end: 'bottom top'}
      });
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function(elm){
      elm.style.opacity = 1; elm.style.transform = 'none';
    });
    document.querySelectorAll('[data-count]').forEach(function(elm){
      elm.textContent = elm.dataset.count;
    });
  }
})();

/* ============ SEMILLERO — hover / tap video ============ */
/* Nothing preloads and nothing plays until the visitor asks for it: hover on a
   pointer device, tap on touch. Playback ping-pongs (forward, then reverse) so
   the loop never jumps, since the clips do not end where they begin. */
(function(){
  var steps = document.querySelectorAll('.sem-step[data-sem]');
  if(!steps.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced) return;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  steps.forEach(function(step){
    var vid = step.querySelector('.sem-video');
    if(!vid) return;

    if(!canHover){
      var hint = document.createElement('div');
      hint.className = 'sem-hint';
      hint.setAttribute('aria-hidden','true');
      hint.textContent = '▶';
      step.appendChild(hint);
    }

    var loaded = false, back = false, raf = 0;

    function load(){
      if(loaded) return;
      loaded = true;
      // prefer webm when the browser lacks proprietary H.264
      var webm = vid.getAttribute('data-webm'), mp4 = vid.getAttribute('data-mp4');
      var canMp4 = !!vid.canPlayType('video/mp4; codecs="avc1.42E01E"');
      vid.src = canMp4 ? mp4 : webm;
      vid.addEventListener('error', function once(){
        vid.removeEventListener('error', once);
        var alt = (vid.src.indexOf('.mp4') > -1) ? webm : mp4;
        if(alt){ vid.src = alt; vid.load(); vid.play().catch(function(){}); }
      });
      vid.load();
    }
    function reverse(){
      // step backwards by hand: browsers cannot play a video in reverse
      cancelAnimationFrame(raf);
      var last = performance.now();
      (function tick(now){
        var dt = (now - last) / 1000; last = now;
        vid.currentTime = Math.max(0, vid.currentTime - dt);
        if(vid.currentTime <= 0.02){ back = false; vid.play().catch(function(){}); return; }
        raf = requestAnimationFrame(tick);
      })(last);
    }
    function start(){
      load();
      step.classList.add('is-playing');
      cancelAnimationFrame(raf);
      if(back){ back = false; }
      vid.play().catch(function(){});
    }
    function stop(){
      cancelAnimationFrame(raf);
      back = false;
      vid.pause();
      step.classList.remove('is-playing');
      // let the fade finish before snapping back to the first frame
      setTimeout(function(){ if(!step.classList.contains('is-playing')) vid.currentTime = 0; }, 520);
    }

    vid.addEventListener('ended', function(){ back = true; reverse(); });

    if(canHover){
      step.addEventListener('mouseenter', start);
      step.addEventListener('mouseleave', stop);
      step.addEventListener('focusin', start);
      step.addEventListener('focusout', stop);
    } else {
      step.addEventListener('click', function(){
        if(step.classList.contains('is-playing')) stop(); else start();
      });
    }
  });
})();
