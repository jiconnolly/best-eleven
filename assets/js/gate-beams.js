/* BESG entry gate — stadium light beams behind the globe.
   Procedural: no video, no extra asset, ~2 KB. Disable with window.GATE_BEAMS = false. */
(function(){
  if(window.GATE_BEAMS === false) return;
  var gate = document.getElementById('gate');
  if(!gate) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cv = document.createElement('canvas');
  cv.id = 'gateBeams';
  cv.setAttribute('aria-hidden', 'true');
  // first child of #gate, so it paints behind the WebGL canvas (which is alpha:true)
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;' +
                     'pointer-events:none;';
  gate.insertBefore(cv, gate.firstChild);
  var ctx = cv.getContext('2d');

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var src = null, srcW = 0, srcH = 0, keyW = 0, keyH = 0;

  // The beams are baked once into an offscreen canvas and then only panned, so the
  // per-frame cost is a single drawImage. Baked at reduced resolution: they are very
  // soft gradients, the upscale is invisible and it saves memory on mobile.
  function build(){
    var destW = cv.width * 1.6, destH = cv.height;
    var s = Math.min(1, 1500 / Math.max(destW, 1));
    srcW = Math.max(2, Math.round(destW * s));
    srcH = Math.max(2, Math.round(destH * s));
    var c = document.createElement('canvas');
    c.width = srcW; c.height = srcH;
    var x = c.getContext('2d');

    var BEAMS = [{p:0.17, w:0.20, a:0.040},
                 {p:0.48, w:0.29, a:0.028},
                 {p:0.79, w:0.17, a:0.036}];
    x.save();
    x.translate(srcW * 0.5, srcH * 0.5);
    x.rotate(-0.36);                                  // diagonal fall, like floodlights
    var L = Math.max(srcW, srcH) * 2.1;
    for(var i = 0; i < BEAMS.length; i++){
      var b = BEAMS[i], bx = (b.p - 0.5) * srcW * 1.15, wp = b.w * srcW * 0.5;
      var g = x.createLinearGradient(bx - wp, 0, bx + wp, 0);
      g.addColorStop(0,   'rgba(201,169,97,0)');
      g.addColorStop(0.5, 'rgba(214,184,116,' + b.a + ')');
      g.addColorStop(1,   'rgba(201,169,97,0)');
      x.fillStyle = g;
      x.fillRect(bx - wp, -L * 0.5, wp * 2, L);
    }
    x.restore();

    // fade top and bottom so the beams never cut off square
    var fd = x.createLinearGradient(0, 0, 0, srcH);
    fd.addColorStop(0,    'rgba(0,0,0,1)');
    fd.addColorStop(0.40, 'rgba(0,0,0,0)');
    fd.addColorStop(0.60, 'rgba(0,0,0,0)');
    fd.addColorStop(1,    'rgba(0,0,0,1)');
    x.globalCompositeOperation = 'destination-out';
    x.fillStyle = fd; x.fillRect(0, 0, srcW, srcH);

    x.globalCompositeOperation = 'source-over';

    // Dither the ALPHA channel. At this opacity the gradient quantises into wide flat
    // steps; jittering alpha by well under one level breaks them up. Noise on the RGB
    // channels does not help here and washes the gold toward grey.
    var im = x.getImageData(0, 0, srcW, srcH), dd = im.data;
    for(var k = 0; k < dd.length; k += 4){
      if(dd[k+3] > 0) dd[k+3] = Math.max(0, dd[k+3] + (Math.random() * 2.6 - 1.3));
    }
    x.putImageData(im, 0, 0);

    src = c; keyW = cv.width; keyH = cv.height;
  }

  function resize(){
    var w = gate.clientWidth || window.innerWidth;
    var h = gate.clientHeight || window.innerHeight;
    cv.width  = Math.max(2, Math.round(w * DPR));
    cv.height = Math.max(2, Math.round(h * DPR));
  }
  resize();
  window.addEventListener('resize', resize);

  // fade in on load and out with the entry explosion. Driven by elapsed TIME, not by
  // frame count: on a slow device a per-frame ramp would take seconds to become visible.
  var FADE_IN = 1400, FADE_OUT = 700;
  var t0 = 0, tDie = 0, fade = 0, dying = false;
  new MutationObserver(function(){
    if(dying) return;
    if(gate.classList.contains('entering') || gate.classList.contains('off')){
      dying = true; tDie = performance.now();
    }
  }).observe(gate, {attributes:true, attributeFilter:['class']});

  var PERIOD = 78000;   // one very slow drift cycle
  var running = true;
  function frame(t){
    if(!running) return;
    if(!gate.isConnected){ running = false; return; }   // gate is removed after entering
    requestAnimationFrame(frame);

    var now = performance.now();
    if(!t0) t0 = now;
    if(dying){
      fade = 1 - Math.min(1, (now - tDie) / FADE_OUT);
      if(fade <= 0){ running = false; ctx.clearRect(0,0,cv.width,cv.height); return; }
    } else {
      fade = Math.min(1, (now - t0) / FADE_IN);
    }
    if(!src || keyW !== cv.width || keyH !== cv.height) build();

    ctx.clearRect(0, 0, cv.width, cv.height);
    var destW = cv.width * 1.6, destH = cv.height;
    var off = reduced ? (destW - cv.width) * 0.5
                      : ((t % PERIOD) / PERIOD) * (destW - cv.width);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.drawImage(src, 0, 0, srcW, srcH, -off, 0, destW, destH);
    ctx.restore();
  }
  requestAnimationFrame(frame);
})();
