/* BESG entry gate — detailed 3D Earth + explosive enter transition */
(function(){
  var gate = document.getElementById('gate');
  var holder = document.getElementById('gateGlobe');
  if(!gate || !holder || typeof THREE === 'undefined') return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.body.classList.add('gated');

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(0, 0, 2.55);

  var renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  holder.appendChild(renderer.domElement);

  var world = new THREE.Group();
  scene.add(world);
  var R = 1;

  function ll2v(lon, lat, r){
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }
  function softTex(color){
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0, color); g.addColorStop(0.45, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0,0,64,64);
    return new THREE.CanvasTexture(c);
  }
  var goldTex = softTex('rgba(228,203,142,1)');
  var steelTex = softTex('rgba(160,175,190,0.9)');

  function cloud(arr, r){
    var n = arr.length / 2, pos = new Float32Array(n * 3);
    for(var i = 0; i < n; i++){
      var v = ll2v(arr[i*2], arr[i*2+1], r);
      pos[i*3] = v.x; pos[i*3+1] = v.y; pos[i*3+2] = v.z;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }
  // exploding cloud bookkeeping: base positions + per-point speeds
  var explosive = [];
  function makeExplosive(geo, mat, baseSize, baseOpacity, spread){
    var pos = geo.getAttribute('position');
    var n = pos.count, speeds = new Float32Array(n);
    for(var i = 0; i < n; i++) speeds[i] = spread * (0.5 + Math.random() * 1.6);
    explosive.push({geo: geo, mat: mat, base: pos.array.slice(), speeds: speeds,
                    baseSize: baseSize, baseOpacity: baseOpacity});
  }

  // world landmass — pale steel
  var worldMat = new THREE.PointsMaterial({
    size: 0.0145, map: steelTex, color: 0xC6D5E3, transparent: true, opacity: 0.95,
    depthWrite: false, sizeAttenuation: true
  });
  if(typeof WORLD_POINTS !== 'undefined'){
    var wGeo = cloud(WORLD_POINTS, R);
    world.add(new THREE.Points(wGeo, worldMat));
    makeExplosive(wGeo, worldMat, 0.013, 0.85, 3.2);
  }
  // South America — gold
  var saMat = new THREE.PointsMaterial({
    size: 0.0168, map: goldTex, color: 0xD4B570, transparent: true, opacity: 1,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
  });
  if(typeof SA_POINTS !== 'undefined'){
    var sGeo = cloud(SA_POINTS, R + 0.003);
    world.add(new THREE.Points(sGeo, saMat));
    makeExplosive(sGeo, saMat, 0.015, 0.95, 5.5);
  }

  // solid shell: hides the far side so the planet reads as a body, not a cloud.
  // Grained rather than flat, so the surface reads as panelled leather.
  function ballTex(){
    var S = 512, c = document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d');
    x.fillStyle = '#07101a'; x.fillRect(0, 0, S, S);
    // broad mottling — the unevenness of a stitched panel
    for(var i = 0; i < 150; i++){
      var cx = Math.random() * S, cy = Math.random() * S, rr = 20 + Math.random() * 60;
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
      var a = 0.03 + Math.random() * 0.05;
      g.addColorStop(0, 'rgba(126,152,180,' + a + ')');
      g.addColorStop(1, 'rgba(126,152,180,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rr, 0, Math.PI * 2); x.fill();
    }
    // fine grain
    var img = x.getImageData(0, 0, S, S), d = img.data;
    for(var p = 0; p < d.length; p += 4){
      var n = (Math.random() - 0.5) * 13;
      d[p] += n; d[p+1] += n; d[p+2] += n;
    }
    x.putImageData(img, 0, 0);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 2);
    return t;
  }
  var shell = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.992, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0xffffff, map: ballTex() })
  );
  world.add(shell);

  // camera-locked sheen: gives the sphere volume so it reads as a ball, not a disc.
  // Lives in the scene (not `world`), so it stays put while the planet turns.
  var sheen = new THREE.Sprite(new THREE.SpriteMaterial({
    map: (function(){
      var c = document.createElement('canvas'); c.width = c.height = 256;
      var x = c.getContext('2d');
      var g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(188,214,240,0.5)');
      g.addColorStop(0.5, 'rgba(150,180,214,0.14)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(c);
    })(),
    transparent: true, opacity: 0.30, depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  sheen.position.set(-0.34, 0.36, 1.02);
  sheen.scale.setScalar(1.15);
  scene.add(sheen);

  // truncated icosahedron: the panel pattern of a football (12 pentagons + 20 hexagons)
  var BALL_V=[-0.2018,-0.73,-0.653,-0.4035,-0.8547,-0.3265,-0.3265,-0.4035,-0.8547,-0.653,-0.2018,-0.73,0,-0.2018,-0.9794,0,0.2018,-0.9794,0.2018,-0.73,-0.653,0.4035,-0.8547,-0.3265,0.3265,-0.4035,-0.8547,0.653,-0.2018,-0.73,-0.73,-0.653,-0.2018,-0.8547,-0.3265,-0.4035,-0.4035,-0.8547,0.3265,-0.2018,-0.73,0.653,-0.73,-0.653,0.2018,-0.8547,-0.3265,0.4035,-0.2018,-0.9794,0,0.2018,-0.9794,0,-0.8547,0.3265,-0.4035,-0.73,0.653,-0.2018,-0.9794,0,-0.2018,-0.9794,0,0.2018,-0.653,0.2018,-0.73,-0.3265,0.4035,-0.8547,-0.3265,-0.4035,0.8547,-0.653,-0.2018,0.73,0.2018,-0.73,0.653,0.4035,-0.8547,0.3265,0,-0.2018,0.9794,0,0.2018,0.9794,0.3265,-0.4035,0.8547,0.653,-0.2018,0.73,-0.73,0.653,0.2018,-0.8547,0.3265,0.4035,-0.4035,0.8547,-0.3265,-0.2018,0.73,-0.653,-0.4035,0.8547,0.3265,-0.2018,0.73,0.653,-0.2018,0.9794,0,0.2018,0.9794,0,-0.653,0.2018,0.73,-0.3265,0.4035,0.8547,0.3265,0.4035,-0.8547,0.653,0.2018,-0.73,0.2018,0.73,-0.653,0.4035,0.8547,-0.3265,0.73,-0.653,-0.2018,0.8547,-0.3265,-0.4035,0.73,-0.653,0.2018,0.8547,-0.3265,0.4035,0.8547,0.3265,-0.4035,0.73,0.653,-0.2018,0.9794,0,-0.2018,0.9794,0,0.2018,0.2018,0.73,0.653,0.4035,0.8547,0.3265,0.3265,0.4035,0.8547,0.653,0.2018,0.73,0.73,0.653,0.2018,0.8547,0.3265,0.4035];
  var BALL_E=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,8,6,6,0,0,2,2,4,4,8,14,10,10,1,1,16,16,12,12,14,18,22,22,3,3,11,11,20,20,18,28,24,24,13,13,26,26,30,30,28,38,34,34,19,19,32,32,36,36,38,33,21,21,15,15,25,25,40,40,33,44,42,42,5,5,23,23,35,35,44,27,17,17,7,7,46,46,48,48,27,52,47,47,9,9,43,43,50,50,52,37,41,41,29,29,56,56,54,54,37,51,45,45,39,39,55,55,58,58,51,59,57,57,31,31,49,49,53,53,59];
  function ballLines(r, color, opacity){
    var pts=[], SEG=10, PASS=[0.9975, 1.0, 1.0025];   // WebGL caps lines at 1px, so
    for(var q=0;q<PASS.length;q++){                    // trace each edge on 3 close radii
      var rr=r*PASS[q];
      for(var e=0;e<BALL_E.length;e+=2){
        var a=BALL_E[e]*3, b=BALL_E[e+1]*3, prev=null;
        for(var s=0;s<=SEG;s++){
          var t=s/SEG;
          var x=BALL_V[a]+(BALL_V[b]-BALL_V[a])*t;
          var y=BALL_V[a+1]+(BALL_V[b+1]-BALL_V[a+1])*t;
          var z=BALL_V[a+2]+(BALL_V[b+2]-BALL_V[a+2])*t;
          var l=Math.sqrt(x*x+y*y+z*z);          // great-circle arc: hug the sphere
          var p=new THREE.Vector3(x/l*rr, y/l*rr, z/l*rr);
          if(prev) pts.push(prev, p);
          prev=p;
        }
      }
    }
    return new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity, depthWrite: false })
    );
  }
  var grat = ballLines(R * 1.0, 0x8ba2b9, 0.34);
  world.add(grat);

  // atmosphere glow
  var glowC = document.createElement('canvas'); glowC.width = glowC.height = 256;
  var gx = glowC.getContext('2d');
  var gg = gx.createRadialGradient(128,128,70,128,128,128);
  gg.addColorStop(0, 'rgba(90,120,150,0)');
  gg.addColorStop(0.72, 'rgba(126,158,196,0.30)');
  gg.addColorStop(0.86, 'rgba(172,202,232,0.17)');
  gg.addColorStop(1, 'rgba(0,0,0,0)');
  gx.fillStyle = gg; gx.fillRect(0,0,256,256);
  var glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(glowC), transparent: true, depthWrite: false
  }));
  glow.scale.setScalar(3.0);
  scene.add(glow);

  // stars
  (function(){
    var N = 700, pos = new Float32Array(N * 3);
    for(var i = 0; i < N; i++){
      var u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, rr = 26;
      var s = Math.sqrt(1 - u * u);
      pos[i*3] = rr * s * Math.cos(t); pos[i*3+1] = rr * u; pos[i*3+2] = rr * s * Math.sin(t);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.05, map: steelTex, color: 0xAFC2D4, transparent: true, opacity: 0.35,
      depthWrite: false, sizeAttenuation: true
    })));
  })();

  // city markers — Buenos Aires, Asunción, Montevideo, Miami
  var markers = [];
  (function(){
    var cities = [
      {name:'BUENOS AIRES', lon:-58.4, lat:-34.6, below:true},
      {name:'ASUNCIÓN',     lon:-57.6, lat:-25.3},
      {name:'MONTEVIDEO',   lon:-56.2, lat:-34.9},
      {name:'MIAMI',        lon:-80.2, lat: 25.8}
    ];
    function labelTex(text, color){
      var c = document.createElement('canvas'); c.width = 512; c.height = 96;
      var x = c.getContext('2d');
      x.font = '400 38px "B612 Mono", "Courier New", monospace';
      if('letterSpacing' in x) x.letterSpacing = '5px';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      // dark halo first: the type has to survive on top of the dotted landmass
      x.shadowColor = 'rgba(4,8,13,0.9)';
      x.shadowBlur = 10;
      x.fillStyle = 'rgba(4,8,13,0.9)';
      x.fillText(text, 256, 50);
      x.fillText(text, 256, 50);
      x.shadowBlur = 0;
      x.fillStyle = color || 'rgba(214,210,198,0.95)';
      x.fillText(text, 256, 50);
      var t = new THREE.CanvasTexture(c);
      t.minFilter = THREE.LinearFilter;
      return t;
    }
    cities.forEach(function(ct, idx){
      var dir = ll2v(ct.lon, ct.lat, 1).normalize();
      var pos = dir.clone().multiplyScalar(R + 0.015);

      var core = new THREE.Sprite(new THREE.SpriteMaterial({
        map: goldTex, color: 0xD8BE84, transparent: true, opacity: 0.8,
        depthWrite: false
      }));
      core.position.copy(pos); core.scale.setScalar(0.04);
      world.add(core);

      var ring = new THREE.Mesh(
        new THREE.RingGeometry(0.03, 0.035, 40),
        new THREE.MeshBasicMaterial({color:0xC9A961, transparent:true, opacity:0.4, side:THREE.DoubleSide, depthWrite:false})
      );
      ring.position.copy(pos);
      ring.lookAt(dir.clone().multiplyScalar(2));
      world.add(ring);

      var label = new THREE.Sprite(new THREE.SpriteMaterial({
        map: labelTex(ct.name), transparent: true, opacity: 0.6, depthWrite: false
      }));
      label.position.copy(dir.clone().multiplyScalar(R + 0.02));
      label.center.set(0.5, ct.below ? 1.75 : -0.75); // float the text above (or below) the node
      label.scale.set(0.21, 0.0394, 1);
      world.add(label);

      markers.push({dir: dir, core: core, ring: ring, label: label, name: ct.name, labelColor: null, phase: idx * 0.85});
    });

    // export destinations — steel colour to differentiate from our locations
    var DEST_LABEL = 'rgba(166,190,214,0.95)';
    var dests = [
      {name:'CDMX',        lon:-99.1,  lat: 19.4},
      {name:'RÍO DE JANEIRO', lon:-43.2, lat:-22.9, below:true},
      {name:'SÃO PAULO',   lon:-46.6,  lat:-23.55},
      {name:'LONDRES',     lon:-0.13,  lat: 51.5},
      {name:'PARÍS',       lon: 2.35,  lat: 48.86, below:true},
      {name:'MADRID',      lon:-3.7,   lat: 40.4,  below:true},
      {name:'BARCELONA',   lon: 2.17,  lat: 41.39},
      {name:'MÚNICH',      lon: 11.58, lat: 48.14},
      {name:'MILÁN',       lon: 9.19,  lat: 45.46, below:true},
      {name:'ESTAMBUL',    lon: 28.98, lat: 41.01},
      {name:'TEL AVIV',    lon: 34.78, lat: 32.08, below:true},
      {name:'DUBAI',       lon: 55.27, lat: 25.2}
    ];
    dests.forEach(function(ct){
      var dir = ll2v(ct.lon, ct.lat, 1).normalize();
      var pos = dir.clone().multiplyScalar(R + 0.012);
      var core = new THREE.Sprite(new THREE.SpriteMaterial({
        map: steelTex, color: 0xA9C4DC, transparent: true, opacity: 0.7,
        depthWrite: false
      }));
      core.position.copy(pos); core.scale.setScalar(0.028);
      world.add(core);
      var label = new THREE.Sprite(new THREE.SpriteMaterial({
        map: labelTex(ct.name, DEST_LABEL), transparent: true, opacity: 0.5, depthWrite: false
      }));
      label.position.copy(dir.clone().multiplyScalar(R + 0.015));
      label.center.set(0.5, ct.below ? 1.6 : -0.7);
      label.scale.set(0.17, 0.0319, 1);
      world.add(label);
      markers.push({dir: dir, core: core, ring: null, label: label, name: ct.name, labelColor: DEST_LABEL, dest: true, phase: 0});
    });

    if(document.fonts && document.fonts.load){
      document.fonts.load('400 38px "B612 Mono"').then(function(){
        markers.forEach(function(m){
          m.label.material.map = labelTex(m.name, m.labelColor);
          m.label.material.needsUpdate = true;
        });
      });
    }
  })();

  // export arcs — from the BA–MVD–ASU cluster toward Brazil, Mexico, Europe, Middle East and Asia
  var arcs = [];
  (function(){
    var BA = [-58.4,-34.6], MVD = [-56.2,-34.9], ASU = [-57.6,-25.3];
    function mkArc(fromLL, toLL, lift, speed, phase){
      var a = ll2v(fromLL[0], fromLL[1], R + 0.008);
      var b = ll2v(toLL[0], toLL[1], R + 0.008);
      var mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R + lift);
      var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      var geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(100));
      var mat = new THREE.LineDashedMaterial({
        color: 0xC9A961, transparent: true, opacity: 0.20,
        dashSize: 0.03, gapSize: 0.035, depthWrite: false
      });
      var line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      world.add(line);
      var comet = new THREE.Sprite(new THREE.SpriteMaterial({
        map: goldTex, color: 0xE4CB8E, transparent: true, opacity: 0,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
      comet.scale.setScalar(0.026);
      world.add(comet);
      arcs.push({curve: curve, mat: mat, comet: comet, speed: speed, phase: phase, baseOpacity: 0.20});
    }
    mkArc(ASU, [-46.6,-23.55], 0.18, 0.14, 0.0);   // → São Paulo (Brazil)
    mkArc(BA,  [-99.1, 19.4],  0.34, 0.10, 0.35);  // → CDMX (Mexico)
    mkArc(MVD, [-3.7,  40.4],  0.52, 0.075, 0.6);  // → Madrid (Europe)
    mkArc(BA,  [ 9.19, 45.46], 0.58, 0.07, 0.15);  // → Milan (Europe)
    mkArc(ASU, [55.27, 25.2],  0.72, 0.06, 0.8);   // → Dubai (Middle East)
    mkArc(MVD, [103.8, 30.0],  0.85, 0.055, 0.45); // → Asia
  })();

  // start with South America facing the camera
  var target = ll2v(-60, -18, 1).normalize();
  var baseQ = new THREE.Quaternion().setFromUnitVectors(target, new THREE.Vector3(0, 0, 1));
  world.quaternion.copy(baseQ);

  // Keep-out boxes around the opaque bits of the centre column. City labels that
  // drift behind one duck out of the way instead of fighting it for the pixel.
  // Measured per element rather than as one column-wide rect, so the map keeps
  // its labels everywhere the UI is not actually sitting.
  var KEEP_SEL = '.gate-brand, .gate-sub, .gate-logo, .gate-crests, .btn-pitch, .gate-lang';
  var keepOut = [], FADE = 38;
  function measureKeepOut(){
    var g = gate.getBoundingClientRect(), out = [];
    gate.querySelectorAll(KEEP_SEL).forEach(function(el){
      var r = el.getBoundingClientRect();
      if(!r.width || !r.height) return;
      out.push({
        x0: r.left - g.left, x1: r.right - g.left,
        y0: r.top  - g.top,  y1: r.bottom - g.top
      });
    });
    keepOut = out;
  }
  function keepOutFade(sx, sy){
    var best = 1;
    for(var i = 0; i < keepOut.length; i++){
      var k = keepOut[i];
      var d = Math.max(
        Math.max(k.x0 - sx, sx - k.x1),
        Math.max(k.y0 - sy, sy - k.y1)
      );
      if(d >= FADE) continue;
      var f = Math.max(0.05, d / FADE);
      if(f < best) best = f;
    }
    return best;
  }

  function layout(){
    var w = gate.clientWidth, h = gate.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.position.z = w < 700 ? 3.1 : 2.55;
    measureKeepOut();
  }
  layout();
  window.addEventListener('resize', layout);
  window.addEventListener('load', measureKeepOut);

  // blinding flash overlay (above the gate)
  var flash = document.createElement('div');
  flash.id = 'gateFlash';
  document.body.appendChild(flash);

  var running = true, spin = 0, entering = false, tEnter = 0, frameCount = 0;
  var flashOn = false, entered = false, done = false;
  var clock = new THREE.Clock();
  var EXPLODE = 1.35; // seconds

  function frame(){
    if(!running) return;
    requestAnimationFrame(frame);
    var t = clock.getElapsedTime();

    if(entering){
      var p = Math.min((t - tEnter) / EXPLODE, 1);
      var pe = p * p; // accelerating
      // fast spin
      spin -= 0.0016 + 0.16 * pe;
      // explode point clouds outward
      for(var c = 0; c < explosive.length; c++){
        var ex = explosive[c];
        var arr = ex.geo.getAttribute('position').array;
        for(var i = 0; i < ex.speeds.length; i++){
          var f = 1 + pe * ex.speeds[i];
          arr[i*3]   = ex.base[i*3]   * f;
          arr[i*3+1] = ex.base[i*3+1] * f;
          arr[i*3+2] = ex.base[i*3+2] * f;
        }
        ex.geo.getAttribute('position').needsUpdate = true;
        ex.mat.size = ex.baseSize * (1 + p * 2.2);
        ex.mat.opacity = ex.baseOpacity * (1 - 0.45 * p);
      }
      grat.material.opacity = 0.46 * (1 - p);
      glow.scale.setScalar(3.0 + pe * 2.2);

      if(!flashOn && p > 0.55){
        flashOn = true;
        flash.classList.add('on');
      }
      if(!entered && p > 0.85){
        entered = true;
        gate.classList.add('off');
        document.body.classList.remove('gated');
        document.dispatchEvent(new CustomEvent('besg:enter'));
      }
      if(!done && p >= 1){
        done = true;
        setTimeout(function(){ flash.classList.remove('on'); }, 180);
        setTimeout(function(){
          running = false;
          renderer.dispose();
          gate.parentNode && gate.parentNode.removeChild(gate);
        }, 500);
        setTimeout(function(){
          flash.parentNode && flash.parentNode.removeChild(flash);
        }, 1600);
      }
    } else if(!reduced){
      spin -= 0.0016;
    }

    if(!reduced || entering){
      var q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.02 * Math.sin(spin * 2), spin, 0));
      world.quaternion.copy(baseQ).premultiply(q);
    }

    // markers: pulse, hide on the far side, duck behind the centre column,
    // fade out during the explosion
    var pNow = entering ? Math.min((t - tEnter) / EXPLODE, 1) : 0;
    if(!entering && (frameCount++ % 30) === 0) measureKeepOut();
    var vw = renderer.domElement.clientWidth, vh = renderer.domElement.clientHeight;
    for(var mi = 0; mi < markers.length; mi++){
      var m = markers[mi];
      var wp = m.dir.clone().multiplyScalar(R + 0.02).applyQuaternion(world.quaternion);
      var wz = wp.z;
      var vis = Math.max(0, Math.min(1, (wz - 0.02) / 0.4)) * (1 - pNow);
      var ndc = wp.clone().project(camera);
      var duck = keepOutFade((ndc.x * 0.5 + 0.5) * vw, (-ndc.y * 0.5 + 0.5) * vh);
      if(m.ring){
        var pp = (t * 0.5 + m.phase) % 2;
        m.ring.scale.setScalar(1 + pp * 0.8);
        m.ring.material.opacity = Math.max(0, 0.4 * (1 - pp / 2)) * vis * (0.4 + 0.6 * duck);
      }
      m.core.material.opacity = (m.dest ? 0.65 : 0.8) * vis * (0.4 + 0.6 * duck);
      m.label.material.opacity = (m.dest ? 0.55 : 0.72) * vis * duck;
    }
    sheen.material.opacity = 0.30 * (1 - pNow);

    // export arcs: faint dashed paths + travelling gold pulses (outbound direction)
    for(var ai = 0; ai < arcs.length; ai++){
      var A = arcs[ai];
      A.mat.opacity = A.baseOpacity * (1 - pNow);
      var u = (t * A.speed + A.phase) % 1;
      var cp = A.curve.getPoint(u);
      A.comet.position.copy(cp);
      var cz = cp.clone().normalize().applyQuaternion(world.quaternion).z;
      var czv = Math.max(0, Math.min(1, (cz + 0.15) / 0.5));
      A.comet.material.opacity = Math.sin(Math.PI * u) * 0.85 * czv * (1 - pNow);
    }

    renderer.render(scene, camera);
  }
  frame();

  renderer.domElement.style.opacity = 0;
  renderer.domElement.style.transition = 'opacity 1.4s ease 0.2s';
  requestAnimationFrame(function(){ renderer.domElement.style.opacity = 1; });

  function enter(){
    if(entering) return;
    if(reduced){
      // gentle fade, no explosion
      gate.classList.add('off');
      document.body.classList.remove('gated');
      document.dispatchEvent(new CustomEvent('besg:enter'));
      setTimeout(function(){
        running = false; renderer.dispose();
        gate.parentNode && gate.parentNode.removeChild(gate);
        flash.parentNode && flash.parentNode.removeChild(flash);
      }, 1000);
      return;
    }
    entering = true;
    shell.visible = false; grat.visible = false;
    tEnter = clock.getElapsedTime();
    gate.classList.add('entering');
  }
  var btns = gate.querySelectorAll('.gate-enter');
  btns.forEach(function(btn){ btn.addEventListener('click', enter); });

  // Enter from anywhere on the page — the gate never has focus on load, so a
  // listener bound to the gate itself would only fire after the user tabbed in.
  document.addEventListener('keydown', function(e){
    if(entering || e.key !== 'Enter') return;
    if(e.altKey || e.ctrlKey || e.metaKey) return;
    // the language buttons keep their own Enter
    if(e.target && e.target.closest && e.target.closest('.gate-lang')) return;
    e.preventDefault();
    enter();
  });
})();
