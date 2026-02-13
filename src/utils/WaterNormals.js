import { useMemo } from 'react'
import * as THREE from 'three'

// Simple 2D Noise Implementation
// Based on standard noise algorithms
const perm = new Uint8Array(512);
const p = new Uint8Array(256);
for(let i=0; i<256; i++) p[i] = i;
// Shuffle
for(let i=255; i>0; i--) {
    const n = Math.floor(Math.random() * (i+1));
    [p[i], p[n]] = [p[n], p[i]];
}
for(let i=0; i<512; i++) perm[i] = p[i & 255];

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t, a, b) { return a + t * (b - a); }
function grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = perm[X] + Y, AA = perm[A], AB = perm[A + 1];
    const B = perm[X + 1] + Y, BA = perm[B], BB = perm[B + 1];
    return lerp(v, lerp(u, grad(perm[AA], x, y), grad(perm[BA], x - 1, y)),
                   lerp(u, grad(perm[AB], x, y - 1), grad(perm[BB], x - 1, y - 1)));
}

// Fractal Brownian Motion for richer detail
function fbm(x, y) {
    let total = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxValue = 0;
    for(let i=0; i<4; i++) {
        total += noise(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return total / maxValue;
}

export function useWaterNormals(size = 512) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const imgData = ctx.createImageData(size, size)
    const data = imgData.data

    // Scale of noise - slightly larger base scale for FBM
    const scale = 5.0

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const nx = x / size
            const ny = y / size

            // Sample FBM noise at slightly offset positions to get derivatives
            const h = fbm(nx * scale, ny * scale)
            const h_right = fbm((nx + 1/size) * scale, ny * scale)
            const h_up = fbm(nx * scale, (ny + 1/size) * scale)

            // Increased strength for more defined ripples
            const dx = (h_right - h) * 25.0
            const dy = (h_up - h) * 25.0

            const v = new THREE.Vector3(-dx, -dy, 1.0).normalize()

            // Map -1..1 to 0..255
            const r = Math.floor((v.x * 0.5 + 0.5) * 255)
            const g = Math.floor((v.y * 0.5 + 0.5) * 255)
            const b = Math.floor((v.z * 0.5 + 0.5) * 255)

            const index = (y * size + x) * 4
            data[index] = r
            data[index + 1] = g
            data[index + 2] = b
            data[index + 3] = 255
        }
    }

    ctx.putImageData(imgData, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 4)
    // Anisotropy helps with oblique viewing angles
    texture.anisotropy = 16

    return texture
  }, [size])
}
