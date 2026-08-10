import * as THREE from 'three';

export type GarmentNodeMap = Record<string, THREE.Object3D>;

const GARMENT_NAME_HINTS = ['shirt', 'tshirt', 't-shirt', 'tee', 'garment', 'cloth', 'apparel', 'body'];

const isRenderableMesh = (node: THREE.Object3D | undefined): node is THREE.Mesh =>
  Boolean(node && (node as THREE.Mesh).isMesh && (node as THREE.Mesh).geometry);

const normalizeName = (value: string): string => value.trim().toLocaleLowerCase();

const getVertexCount = (mesh: THREE.Mesh): number => {
  const position = mesh.geometry.getAttribute('position');
  return position?.count ?? 0;
};

const getCandidateScore = (
  key: string,
  mesh: THREE.Mesh,
  preferredName: string,
): number => {
  const normalizedPreferred = normalizeName(preferredName);
  const names = [key, mesh.name].map(normalizeName).filter(Boolean);
  const exactPreferred = names.some((name) => name === normalizedPreferred);
  const hintedName = names.some((name) => GARMENT_NAME_HINTS.some((hint) => name.includes(hint)));

  return (exactPreferred ? 1_000_000 : 0) + (hintedName ? 100_000 : 0) + getVertexCount(mesh);
};

export const resolveGarmentMesh = (
  nodes: GarmentNodeMap,
  preferredName: string,
): THREE.Mesh => {
  const preferred = nodes[preferredName];
  if (isRenderableMesh(preferred)) return preferred;

  const candidates = Object.entries(nodes).filter(
    (entry): entry is [string, THREE.Mesh] => isRenderableMesh(entry[1]),
  );

  if (candidates.length === 0) {
    throw new Error('The garment model does not contain a renderable mesh.');
  }

  return candidates.reduce((best, candidate) =>
    getCandidateScore(candidate[0], candidate[1], preferredName) >
    getCandidateScore(best[0], best[1], preferredName)
      ? candidate
      : best,
  )[1];
};
