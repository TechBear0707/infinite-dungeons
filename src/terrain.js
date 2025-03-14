import * as THREE from 'three';
import { Noise } from 'noisejs';

/**
 * Generate fBm noise.
 */
function fbm(x, y, noise, octaves, persistence, lacunarity) {
    let value = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
        value += noise.perlin2(x * frequency, y * frequency) * amplitude;
        maxAmplitude += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return value / maxAmplitude; // Normalize the result
}

/**
 * Create terrain using fBm while storing the original coordinates.
 */
export function createFBMTerrain(width, height, segments, scale, octaves, persistence, lacunarity) {
    const noise = new Noise(Math.random()); // Seeded Perlin Noise
    const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
    const vertices = geometry.attributes.position;

    // Store the original coordinates
    const originalVertices = new Float32Array(vertices.array);

    // Apply fBm to modify terrain vertices
    for (let i = 0; i < vertices.count; i++) {
        let x = vertices.getX(i) / width;
        let y = vertices.getY(i) / height;
        let heightValue = fbm(x * 2, y * 2, noise, octaves, persistence, lacunarity) * scale;
        vertices.setZ(i, heightValue);
    }

    geometry.computeVertexNormals();

    // Terrain Material
    const material = new THREE.MeshStandardMaterial({
        color: 0x808080, // grey color
        wireframe: false,
        flatShading: true
    });

    // Create Terrain Mesh
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2; // Rotate to lay flat

    // Attach original vertex positions to the mesh (or return it as needed)
    terrain.userData.originalVertices = originalVertices;
    console.log(terrain.userData.originalVertices);

    // find max and min z coordinates from original vertices
    let maxZ = -Infinity;
    let minZ = Infinity;
    for (let i = 1; i < originalVertices.length; i += 3) {
        let z = originalVertices[i];
        if (z > maxZ) maxZ = z;
        if (z < minZ) minZ = z;
    }
    console.log("Max Z:", maxZ, "Min Z:", minZ);

    return terrain;
}
