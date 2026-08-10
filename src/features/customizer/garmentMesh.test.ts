import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { resolveGarmentMesh } from './garmentMesh';

const createMesh = (name: string, segments = 1): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1, segments, segments, segments));
  mesh.name = name;
  return mesh;
};

describe('resolveGarmentMesh', () => {
  it('uses the configured mesh when its exporter name is present', () => {
    const preferred = createMesh('Object_2');
    const other = createMesh('Other', 3);

    expect(resolveGarmentMesh({ Object_2: preferred, Other: other }, 'Object_2')).toBe(preferred);
  });

  it('recovers from an exporter rename by preferring garment-like names', () => {
    const garment = createMesh('Classic_Shirt');
    const accessory = createMesh('ButtonCluster', 3);

    expect(
      resolveGarmentMesh({ Classic_Shirt: garment, ButtonCluster: accessory }, 'Object_2'),
    ).toBe(garment);
  });

  it('uses the largest renderable mesh when names provide no useful signal', () => {
    const small = createMesh('MeshA');
    const large = createMesh('MeshB', 4);

    expect(resolveGarmentMesh({ MeshA: small, MeshB: large }, 'Missing')).toBe(large);
  });

  it('rejects models without renderable geometry', () => {
    expect(() => resolveGarmentMesh({ Empty: new THREE.Group() }, 'Object_2')).toThrow(
      'does not contain a renderable mesh',
    );
  });
});
