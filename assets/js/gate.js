/* BESG entry gate — detailed 3D Earth: dim world landmass, gold South America */
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

  // world landmass — dim steel
  if(typeof WORLD_POINTS !== 'undefined'){
    world.add(new THREE.Points(cloud(WORLD_POINTS, R), new THREE.PointsMaterial({
      size: 0.013, map: steelTex, color: 0xBBCCDC, transparent: true, opacity: 0.85,
      depthWrite: false, sizeAttenuation: true
    })));
  }
  // South America — gold, brighter
  if(typeof SA_POINTS !== 'undefined'){
    world.add(new THREE.Points(cloud(SA_POINTS, R + 0.003), new THREE.PointsMaterial({
      size: 0.015, map: goldTex, color: 0xC9A961, transparent: true, opacity: 0.95,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
    })));
  }

  // faint graticule
  var gp = [];
  for(var la = -75; la <= 75; la += 15) for(var lo = -180; lo < 180; lo += 3) gp.push(lo, la);
  for(var lo2 = -180; lo2 < 180; lo2 += 15) for(var la2 = -85; la2 <= 85; la2 += 3) gp.push(lo2, la2);
  world.add(new THREE.Points(cloud(gp, R * 0.998), new THREE.PointsMaterial({
    size: 0.004, map: steelTex, color: 0x6c7f92, transparent: true, opacity: 0.14,
    depthWrite: false, sizeAttenuation: true
  })));

  // atmosphere glow
  var glowC = document.createElement('canvas'); glowC.width = glowC.height = 256;
  var gx = glowC.getContext('2d');
  var gg = gx.createRadialGradient(128,128,70,128,128,128);
  gg.addColorStop(0, 'rgba(90,120,150,0)');
  gg.addColorStop(0.72, 'rgba(120,150,185,0.14)');
  gg.addColorStop(0.88, 'rgba(160,190,220,0.07)');
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

  // start with South America facing the camera
  var target = ll2v(-60, -18, 1).normalize();
  var baseQ = new THREE.Quaternion().setFromUnitVectors(target, new THREE.Vector3(0, 0, 1));
  world.quaternion.copy(baseQ);

  function layout(){
    var w = gate.clientWidth, h = gate.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.position.z = w < 700 ? 3.1 : 2.55;
  }
  layout();
  window.addEventListener('resize', layout);

  var running = true, spin = 0;
  var clock = new THREE.Clock();
  function frame(){
    if(!running) return;
    requestAnimationFrame(frame);
    if(!reduced){
      spin -= 0.0016;
      var q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.02 * Math.sin(spin * 2), spin, 0));
      world.quaternion.copy(baseQ).premultiply(q);
    }
    renderer.render(scene, camera);
  }
  frame();

  renderer.domElement.style.opacity = 0;
  renderer.domElement.style.transition = 'opacity 1.4s ease 0.2s';
  requestAnimationFrame(function(){ renderer.domElement.style.opacity = 1; });

  // enter
  var btn = gate.querySelector('.gate-enter');
  function enter(){
    gate.classList.add('off');
    document.body.classList.remove('gated');
    document.dispatchEvent(new CustomEvent('besg:enter'));
    setTimeout(function(){
      running = false;
      renderer.dispose();
      gate.parentNode && gate.parentNode.removeChild(gate);
    }, 1000);
  }
  if(btn) btn.addEventListener('click', enter);
  gate.addEventListener('keydown', function(e){ if(e.key === 'Enter') enter(); });
})();
