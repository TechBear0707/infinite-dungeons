import * as THREE from 'three';
import { createFBMTerrain } from './terrain';

// creates a 2x2 grid of terrain planes
export function StartingGrid() {
    let grid = [];
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            let terrain = createFBMTerrain(100, 100, 256, 20, 5, 0.5, 2.0);
            terrain.position.x = i * 100;
            terrain.position.y = -50;
            terrain.position.z = j * 100;
            grid.push(terrain);
        }
    }
    return grid;
}

// gets max z coordinate from original vertices
export function getMaxZFromTerrain(terrain) {
    if (!terrain.userData.originalVertices) {
        console.warn("Original vertices not found!");
        return null;
    }

    const originalVertices = terrain.userData.originalVertices;
    let maxZ = -Infinity;

    // Since Y holds the original Z values after rotation, check every 3rd index + 1
    for (let i = 1; i < originalVertices.length; i += 3) {
        let z = originalVertices[i]; // Using Y values from stored originalVertices
        if (z > maxZ) maxZ = z;
    }

    return maxZ;
}

   