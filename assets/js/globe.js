/* BESG hero globe — gold particle South America, club nodes, export arcs */
(function(){
  var el = document.getElementById('globe');
  if(!el || typeof THREE === 'undefined' || typeof SA_POINTS === 'undefined') return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 3.1);

  var renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

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

  // soft round sprite texture
  function dotTexture(color, glow){
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0, color);
    g.addColorStop(glow ? 0.35 : 0.5, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0,0,64,64);
    var t = new THREE.CanvasTexture(c); return t;
  }
  var goldTex = dotTexture('rgba(228,203,142,1)', false);
  var dimTex  = dotTexture('rgba(201,169,97,0.5)', false);

  // --- South America landmass particles ---
  var n = SA_POINTS.length / 2;
  var pos = new Float32Array(n * 3);
  for(var i = 0; i < n; i++){
    var v = ll2v(SA_POINTS[i*2], SA_POINTS[i*2+1], R + 0.002);
    pos[i*3] = v.x; pos[i*3+1] = v.y; pos[i*3+2] = v.z;
  }
  var saGeo = new THREE.BufferGeometry();
  saGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var saMat = new THREE.PointsMaterial({
    size: 0.016, map: goldTex, transparent: true, opacity: 0.95,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    color: 0xC9A961
  });
  world.add(new THREE.Points(saGeo, saMat));

  // solid shell so the far side is hidden and the sphere reads as a planet
  var shell = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.985, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x0a141d })
  );
  world.add(shell);

  // graticule as real lines, visible enough to give the planet structure
  function gratLines(r, step, color, opacity){
    var pts = [];
    for(var lo = -180; lo < 180; lo += step)
      for(var la = -86; la < 86; la += 4) pts.push(ll2v(lo, la, r), ll2v(lo, la + 4, r));
    for(var la2 = -75; la2 <= 75; la2 += step)
      for(var lo2 = -180; lo2 < 180; lo2 += 4) pts.push(ll2v(lo2, la2, r), ll2v(lo2 + 4, la2, r));
    return new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity, depthWrite: false })
    );
  }
  world.add(gratLines(R * 1.001, 15, 0x8ea5bc, 0.36));

  var eqPts = [];
  for(var eo = -180; eo < 180; eo += 3) eqPts.push(ll2v(eo, 0, R * 1.002), ll2v(eo + 3, 0, R * 1.002));
  world.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(eqPts),
    new THREE.LineBasicMaterial({ color: 0xC9A961, transparent: true, opacity: 0.44, depthWrite: false })
  ));

  // atmosphere: a rim of light so the silhouette separates from the page
  (function(){
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(128,128,0,128,128,128);
    g.addColorStop(0,    'rgba(120,150,190,0)');
    g.addColorStop(0.62, 'rgba(120,150,190,0)');
    g.addColorStop(0.745,'rgba(150,180,220,0.26)');
    g.addColorStop(0.86, 'rgba(120,155,200,0.11)');
    g.addColorStop(1,    'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0,0,256,256);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false
    }));
    sp.scale.setScalar(2.72);
    world.add(sp);
  })();

  // --- club city nodes ---
  var cities = [
    {name:'Buenos Aires', lon:-58.4, lat:-34.6},
    {name:'Asunción',     lon:-57.6, lat:-25.3},
    {name:'Montevideo',   lon:-56.2, lat:-34.9},
    {name:'Miami',        lon:-80.2, lat: 25.8}
  ];
  var rings = [];
  cities.forEach(function(c, idx){
    var v = ll2v(c.lon, c.lat, R + 0.012);
    var core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: goldTex, color: 0xF2DCA6, transparent: true, opacity: 1,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    core.position.copy(v); core.scale.setScalar(0.055);
    world.add(core);

    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.026, 0.03, 40),
      new THREE.MeshBasicMaterial({color:0xC9A961, transparent:true, opacity:0.8, side:THREE.DoubleSide, depthWrite:false})
    );
    ring.position.copy(v);
    ring.lookAt(v.clone().multiplyScalar(2));
    ring.userData.phase = idx * 0.9;
    world.add(ring);
    rings.push(ring);
  });

  // --- export arcs (to Europe + Miami) ---
  function arc(fromLL, toLL, lift){
    var a = ll2v(fromLL[0], fromLL[1], R + 0.01);
    var b = ll2v(toLL[0], toLL[1], R + 0.01);
    var mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R + lift);
    var curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    var pts = curve.getPoints(90);
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineDashedMaterial({
      color: 0xE4CB8E, transparent: true, opacity: 0.55,
      dashSize: 0.055, gapSize: 0.045, depthWrite: false
    });
    var line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    world.add(line);
    return mat;
  }
  var MADRID = [-3.7, 40.4], LONDON = [-0.1, 51.5], LISBON = [-9.1, 38.7], MIA = [-80.2, 25.8];
  var arcMats = [
    arc([-58.4,-34.6], MADRID, 0.55),
    arc([-56.2,-34.9], LISBON, 0.48),
    arc([-57.6,-25.3], LONDON, 0.62),
    arc([-58.4,-34.6], MIA,    0.30)
  ];

  // orient: face South America (~lon -60, lat -22) toward camera
  var target = ll2v(-60, -22, 1).normalize();
  var q = new THREE.Quaternion().setFromUnitVectors(target, new THREE.Vector3(0,0,1));
  world.quaternion.copy(q);
  var baseQ = world.quaternion.clone();

  // layout: pull globe to the right on wide screens
  function layout(){
    var w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if(w > 980){
      world.position.set(0.62, -0.05, 0);
      camera.position.z = 2.9;
    } else {
      world.position.set(0, -0.55, 0);
      camera.position.z = 3.4;
    }
  }
  layout();
  window.addEventListener('resize', layout);

  var mx = 0, my = 0;
  if(!reduced){
    window.addEventListener('pointermove', function(e){
      mx = (e.clientX / window.innerWidth - 0.5);
      my = (e.clientY / window.innerHeight - 0.5);
    }, {passive:true});
  }

  var clock = new THREE.Clock();
  var visible = true;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(en){ visible = en[0].isIntersecting; }).observe(el);
  }

  function frame(){
    requestAnimationFrame(frame);
    if(!visible) return;
    var t = clock.getElapsedTime();
    if(!reduced){
      var yaw = Math.sin(t * 0.12) * 0.16 + mx * 0.35;
      var pitch = Math.cos(t * 0.09) * 0.05 + my * 0.2;
      var e = new THREE.Euler(pitch, yaw, 0, 'XYZ');
      world.quaternion.copy(baseQ).premultiply(new THREE.Quaternion().setFromEuler(e));
      rings.forEach(function(r){
        var p = (t * 0.9 + r.userData.phase) % 2;
        var s = 1 + p * 2.4;
        r.scale.setScalar(s);
        r.material.opacity = Math.max(0, 0.8 * (1 - p / 2));
      });
      arcMats.forEach(function(m, i){
        m.opacity = 0.28 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.7 + i * 1.4));
      });
    }
    renderer.render(scene, camera);
  }
  frame();

  // fade the canvas in
  renderer.domElement.style.opacity = 0;
  renderer.domElement.style.transition = 'opacity 1.6s ease 0.4s';
  requestAnimationFrame(function(){ renderer.domElement.style.opacity = 1; });
})();
