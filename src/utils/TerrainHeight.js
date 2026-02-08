// src/utils/TerrainHeight.js
export const getTerrainHeight = (x, z) => {
  // Height map logic
  // Consistent with ForestFloor.jsx logic but refined
  // y = -z (because plane Y is World Z in ForestFloor, see previous thought process)
  // Let's stick to World Coordinates (x, z).

  // Base Noise
  // Must match what we want visually.
  // We want a river valley at X=0.

  const noise = (Math.sin(x * 0.1) + Math.cos((-z) * 0.1)) * 0.5
              + (Math.sin(x * 0.3 + (-z) * 0.2)) * 0.2

  let h = noise * 2.5

  // River Valley: Dip at X=0
  // Deep enough to submerge below -0.5 (water level)
  // Gaussian valley
  const valleyDepth = 4.0;
  const valleyWidth = 40.0; // Width parameter
  const valley = valleyDepth * Math.exp(-(x * x) / (2 * valleyWidth * valleyWidth));

  h -= valley;

  return h;
}
