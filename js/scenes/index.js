import electrostatics from './electrostatics.js';
import distributions from './distributions.js';
import gauss from './gauss.js';
import potential from './potential.js';
import capacitors from './capacitors.js';
import circuits from './circuits.js';
import magnetic from './magnetic.js';
import biotSavart from './biotSavart.js';
import faraday from './faraday.js';
import acMaxwell from './acMaxwell.js';
import sandbox from './sandbox.js';

export const categories = [
  { id: 'sandbox', title: 'Sandbox', scenes: [sandbox] },
  { id: 'electrostatics', title: "Coulomb's Law & Point Charges", scenes: electrostatics },
  { id: 'distributions', title: 'Continuous Charge Distributions', scenes: distributions },
  { id: 'gauss', title: "Gauss's Law", scenes: gauss },
  { id: 'potential', title: 'Electric Potential', scenes: potential },
  { id: 'capacitors', title: 'Capacitors & Energy', scenes: capacitors },
  { id: 'circuits', title: 'DC Circuits', scenes: circuits },
  { id: 'magnetic', title: 'Magnetic Fields & Forces', scenes: magnetic },
  { id: 'biotSavart', title: "Sources of B (Biot-Savart & Ampère)", scenes: biotSavart },
  { id: 'faraday', title: "Faraday's Law & Induction", scenes: faraday },
  { id: 'acMaxwell', title: "AC Circuits & Maxwell's Equations", scenes: acMaxwell }
];

export function findScene(id) {
  for (const cat of categories) {
    const scene = cat.scenes.find(s => s.id === id);
    if (scene) return { scene, category: cat };
  }
  return null;
}
