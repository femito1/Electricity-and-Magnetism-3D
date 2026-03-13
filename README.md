# E&M 3D Visualizer

Interactive 3D visualizer for electricity and magnetism problems, covering the full Rice University Coursera E&M specialization curriculum.

## Quick Start

This is a zero-dependency web app (Three.js and KaTeX are loaded from CDN). You just need a local HTTP server:

```bash
# Option A: Python (pre-installed on most systems)
python3 -m http.server 8080

# Option B: Node.js
npx serve .
```

Then open **http://localhost:8080** in your browser.

## What's Included

**69 interactive 3D scenes** across 10 categories:

| # | Category | Scenes | Topics |
|---|----------|--------|--------|
| 1 | Coulomb's Law & Point Charges | 5 | Point charge, dipole, superposition, Coulomb force, charge in E field |
| 2 | Continuous Charge Distributions | 9 | Finite rod, infinite line, ring, disk, plane, arc, shell, solid sphere |
| 3 | Gauss's Law | 10 | Flux concept, spherical/cylindrical/pillbox Gaussian surfaces, all geometries |
| 4 | Electric Potential | 8 | V from charges, equipotential surfaces, E = -grad(V) |
| 5 | Capacitors & Energy | 5 | Parallel plate, cylindrical, spherical, dielectric, energy density |
| 6 | DC Circuits | 4 | Ohm's law, series/parallel, Kirchhoff's rules, RC circuits |
| 7 | Magnetic Fields & Forces | 5 | Charged particle in B, velocity selector, wire in B, torque on loop, Hall effect |
| 8 | Sources of B (Biot-Savart & Ampere) | 9 | Wire, loop, solenoid, toroid fields; Amperian loops; parallel wires |
| 9 | Faraday's Law & Induction | 7 | Magnetic flux, changing B, motional EMF, generators, eddy currents, LR circuits |
| 10 | AC Circuits & Maxwell's Equations | 7 | AC R/L/C, RLC resonance, displacement current, EM waves, Poynting vector |

## Features

- **3D interactive viewport** with orbit, zoom, and pan controls
- **Symbolic quantity overlays** (dx, dθ, dr, dA, dE, dB, etc.) rendered with KaTeX
- **Adjustable parameters** via sliders (charge, distance, radius, etc.) with real-time updates
- **Toggle controls** for field lines, field vectors, Gaussian surfaces, etc.
- **Animated scenes** with play/pause and speed control (circuits, Faraday, AC, EM waves)
- **Equation panel** showing relevant formulas for each problem
- **Search** across all 69 problems

## Tech Stack

- **Three.js** (r162) for 3D rendering
- **KaTeX** for LaTeX math rendering
- **CSS2DRenderer** for 3D-anchored labels
- Vanilla JS with ES modules — no build step required
