import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.153.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

const planetRadius = 3;
const planet = new THREE.Mesh(
  new THREE.SphereGeometry(planetRadius, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x2266dd })
);
scene.add(planet);

const satellites = [];

class Satellite {
  constructor(type, altitude, speed) {
    this.type = type;
    this.altitude = altitude;
    this.speed = speed;
    const geom = new THREE.SphereGeometry(0.1, 8, 8);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
    this.mesh = new THREE.Mesh(geom, mat);
    scene.add(this.mesh);
    this.phase = 'orbit';
    const r = planetRadius + altitude;
    if (type.includes('surface')) {
      this.phase = 'launch';
      this.mesh.position.set(planetRadius, 0, 0);
      this.velocity = new THREE.Vector3(0, speed, 0);
    } else {
      this.mesh.position.set(r, 0, 0);
      this.velocity = new THREE.Vector3(0, 0, speed);
    }
  }
  update(dt) {
    if (this.type.includes('static')) {
      const r = planetRadius + this.altitude;
      const angle = performance.now() / 1000 * this.speed;
      this.mesh.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      return;
    }
    if (this.type.includes('surface') && this.phase === 'launch') {
      this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
      const radial = this.mesh.position.length();
      if (radial >= planetRadius + this.altitude) {
        this.phase = 'orbit';
        this.mesh.position.set(planetRadius + this.altitude, 0, 0);
        this.velocity.set(0, 0, this.speed);
      }
      return;
    }
    // basic gravity based on inverse square law
    const G = 1;
    const dir = this.mesh.position.clone().multiplyScalar(-1);
    const r2 = dir.lengthSq();
    const acc = dir.normalize().multiplyScalar(G * (planetRadius * planetRadius) / r2);
    this.velocity.add(acc.multiplyScalar(dt));
    this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
  }
}

function spawnSatellite() {
  const type = document.getElementById('satType').value;
  const altitude = parseFloat(document.getElementById('altitude').value);
  const speed = parseFloat(document.getElementById('speed').value);
  const sat = new Satellite(type, altitude, speed);
  satellites.push(sat);
}

document.getElementById('spawn').addEventListener('click', spawnSatellite);
document.getElementById('reset').addEventListener('click', () => {
  satellites.forEach((s) => scene.remove(s.mesh));
  satellites.length = 0;
});

const ui = document.getElementById('ui');
const toggle = document.getElementById('toggle');
toggle.addEventListener('click', () => {
  ui.classList.toggle('collapsed');
});

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

let last = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = (now - last) / 1000;
  last = now;
  satellites.forEach((s) => s.update(dt));
  controls.update();
  renderer.render(scene, camera);
}
animate();
