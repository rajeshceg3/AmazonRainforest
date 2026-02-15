export const pseudoNoise = (t, seed = 0) => {
  // Sum of sines with prime frequencies to avoid repetition
  return (
    Math.sin(t * 1.0 + seed) * 0.5 +
    Math.sin(t * 2.3 + seed * 2.0) * 0.25 +
    Math.sin(t * 4.7 + seed * 3.0) * 0.125 +
    Math.sin(t * 9.1 + seed * 4.0) * 0.0625
  );
};

export const remap = (value, min1, max1, min2, max2) => {
  return min2 + (max2 - min2) * ((value - min1) / (max1 - min1));
};

export const mix = (a, b, t) => {
  return a * (1 - t) + b * t;
};

export const smoothStep = (t) => {
  return t * t * (3 - 2 * t);
};
