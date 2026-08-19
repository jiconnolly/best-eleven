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
    size: 0.0178, map: goldTex, transparent: true, opacity: 1,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    color: 0xC9A961
  });
  world.add(new THREE.Points(saGeo, saMat));

  // solid shell so the far side is hidden and the sphere reads as a planet
  var shell = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.992, 64, 48),
    new THREE.MeshBasicMaterial({ color: 0x0a141d })
  );
  world.add(shell);

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
  world.add(ballLines(R * 1.0, 0x8ea5bc, 0.32));

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
    {name:'Buenos Aires', lon:-58.4, lat:-34.6, crest:'assets/img/crest-colegiales.png', off:[-0.055,-0.030]},
    {name:'Asunción',     lon:-57.6, lat:-25.3, crest:'assets/img/crest-rubio.png',      off:[ 0.052, 0.030]},
    {name:'Montevideo',   lon:-56.2, lat:-34.9, crest:'assets/img/crest-lito.png',       off:[ 0.058,-0.048]},
    {name:'Miami',        lon:-80.2, lat: 25.8}
  ];
  var rings = [], crests = [];
  var texLoader = new THREE.TextureLoader();
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

    // club crest, lifted clear of the surface so it never clips into the globe
    if(c.crest){
      var dir = v.clone().normalize();
      // nudge each badge off its own pin: Buenos Aires and Montevideo sit ~200km
      // apart and would otherwise overlap almost completely at this scale
      var up = new THREE.Vector3(0,1,0);
      var east = new THREE.Vector3().crossVectors(up, dir).normalize();
      var north = new THREE.Vector3().crossVectors(dir, east).normalize();
      var o = c.off || [0,0];
      var at = dir.clone().multiplyScalar(R + 0.05)
                 .add(east.clone().multiplyScalar(o[0]))
                 .add(north.clone().multiplyScalar(o[1]));

      var tex = texLoader.load(c.crest);
      tex.minFilter = THREE.LinearFilter;
      var badge = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, opacity: 0, depthWrite: false, depthTest: false
      }));
      badge.position.copy(at);
      badge.scale.setScalar(0.078);
      badge.renderOrder = 10;
      world.add(badge);

      // hairline tying the badge back to its pin
      var leadMat = new THREE.LineBasicMaterial({color:0xC9A961, transparent:true, opacity:0, depthWrite:false, depthTest:false});
      var lead = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([dir.clone().multiplyScalar(R + 0.014), at.clone()]),
        leadMat
      );
      lead.renderOrder = 9;
      world.add(lead);

      crests.push({sprite: badge, lead: leadMat, dir: dir});
    }
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
      // crests only exist while their node faces the camera
      crests.forEach(function(c){
        var wp = c.dir.clone().applyQuaternion(world.quaternion);
        var vis = Math.max(0, Math.min(1, (wp.z - 0.08) / 0.42));
        c.sprite.material.opacity = vis;
        c.lead.opacity = vis * 0.5;
      });
    }
    renderer.render(scene, camera);
  }
  if(reduced){
    crests.forEach(function(c){
      var wp = c.dir.clone().applyQuaternion(world.quaternion);
      var vis = Math.max(0, Math.min(1, (wp.z - 0.08) / 0.42));
      c.sprite.material.opacity = vis;
      c.lead.opacity = vis * 0.5;
    });
  }
  frame();

  // fade the canvas in
  renderer.domElement.style.opacity = 0;
  renderer.domElement.style.transition = 'opacity 1.6s ease 0.4s';
  requestAnimationFrame(function(){ renderer.domElement.style.opacity = 1; });
})();
