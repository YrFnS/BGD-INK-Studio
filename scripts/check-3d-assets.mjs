import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDirectory = path.join(root, 'public');
const budgets = JSON.parse(
  await readFile(path.join(root, 'src/config/asset-budgets.json'), 'utf8'),
).models;

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const formatKiB = (bytes) => `${(bytes / 1024).toFixed(2)} KiB`;

const listGlbFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return listGlbFiles(entryPath);
      return entry.isFile() && entry.name.toLowerCase().endsWith('.glb') ? [entryPath] : [];
    }),
  );
  return nested.flat();
};

const isGitLfsPointer = (buffer) =>
  buffer.subarray(0, 80).toString('utf8').startsWith('version https://git-lfs.github.com/spec/');

const readUint24LittleEndian = (buffer, offset) =>
  buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);

const readImageDimensions = (buffer) => {
  if (
    buffer.length >= 24 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return {
      format: 'png',
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }

  if (buffer.length >= 4 && buffer.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    const startOfFrameMarkers = new Set([
      0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
    ]);

    while (offset + 3 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
      if (offset >= buffer.length) break;
      const marker = buffer[offset];
      offset += 1;
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (marker === 0xda || offset + 1 >= buffer.length) break;
      const segmentLength = buffer.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > buffer.length) break;
      if (startOfFrameMarkers.has(marker) && segmentLength >= 7) {
        return {
          format: 'jpeg',
          width: buffer.readUInt16BE(offset + 5),
          height: buffer.readUInt16BE(offset + 3),
        };
      }
      offset += segmentLength;
    }
  }

  if (
    buffer.length >= 30 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const chunkType = buffer.toString('ascii', 12, 16);
    if (chunkType === 'VP8X') {
      return {
        format: 'webp',
        width: readUint24LittleEndian(buffer, 24) + 1,
        height: readUint24LittleEndian(buffer, 27) + 1,
      };
    }
    if (chunkType === 'VP8L' && buffer[20] === 0x2f) {
      return {
        format: 'webp',
        width: 1 + buffer[21] + ((buffer[22] & 0x3f) << 8),
        height: 1 + (buffer[22] >> 6) + (buffer[23] << 2) + ((buffer[24] & 0x0f) << 10),
      };
    }
    if (
      chunkType === 'VP8 ' &&
      buffer[23] === 0x9d &&
      buffer[24] === 0x01 &&
      buffer[25] === 0x2a
    ) {
      return {
        format: 'webp',
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
  }

  return { format: 'unknown', width: null, height: null };
};

const decodeDataUri = (uri) => {
  const separator = uri.indexOf(',');
  if (separator < 0) return null;
  const metadata = uri.slice(0, separator);
  const payload = uri.slice(separator + 1);
  return metadata.includes(';base64')
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8');
};

const readImageBuffer = async (image, json, binaryChunk, filePath) => {
  if (Number.isInteger(image.bufferView)) {
    const view = json.bufferViews?.[image.bufferView];
    if (!view || !binaryChunk) return null;
    const offset = view.byteOffset ?? 0;
    return binaryChunk.subarray(offset, offset + view.byteLength);
  }

  if (typeof image.uri !== 'string') return null;
  if (image.uri.startsWith('data:')) return decodeDataUri(image.uri);
  return readFile(path.resolve(path.dirname(filePath), decodeURIComponent(image.uri)));
};

const getAccessorCount = (json, accessorIndex) => {
  if (!Number.isInteger(accessorIndex)) return 0;
  const count = json.accessors?.[accessorIndex]?.count;
  return Number.isFinite(count) ? count : 0;
};

const countPrimitiveTriangles = (primitive, json) => {
  const count = Number.isInteger(primitive.indices)
    ? getAccessorCount(json, primitive.indices)
    : getAccessorCount(json, primitive.attributes?.POSITION);
  const mode = primitive.mode ?? 4;
  if (mode === 4) return Math.floor(count / 3);
  if (mode === 5 || mode === 6) return Math.max(0, count - 2);
  return 0;
};

const inspectGlb = async (filePath) => {
  const buffer = await readFile(filePath);
  if (isGitLfsPointer(buffer)) {
    throw new Error(
      `${path.relative(root, filePath)} is still a Git LFS pointer. Run git lfs pull before validating assets.`,
    );
  }
  if (buffer.length < 20 || buffer.readUInt32LE(0) !== GLB_MAGIC) {
    throw new Error(`${path.relative(root, filePath)} is not a valid binary glTF file.`);
  }
  if (buffer.readUInt32LE(4) !== 2) {
    throw new Error(`${path.relative(root, filePath)} must use glTF 2.0.`);
  }
  const declaredLength = buffer.readUInt32LE(8);
  if (declaredLength !== buffer.length) {
    throw new Error(
      `${path.relative(root, filePath)} declares ${declaredLength} bytes but contains ${buffer.length}.`,
    );
  }

  let offset = 12;
  let jsonChunk = null;
  let binaryChunk = null;
  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunk = buffer.subarray(offset + 8, offset + 8 + chunkLength);
    if (chunkType === JSON_CHUNK) jsonChunk = chunk;
    if (chunkType === BIN_CHUNK) binaryChunk = chunk;
    offset += 8 + chunkLength;
  }
  if (!jsonChunk) throw new Error(`${path.relative(root, filePath)} has no JSON chunk.`);

  const json = JSON.parse(jsonChunk.toString('utf8').replace(/\0+$/u, '').trim());
  const meshes = json.meshes ?? [];
  const primitives = meshes.flatMap((mesh) => mesh.primitives ?? []);
  const triangles = primitives.reduce(
    (total, primitive) => total + countPrimitiveTriangles(primitive, json),
    0,
  );
  const images = [];

  for (const [index, image] of (json.images ?? []).entries()) {
    const imageBuffer = await readImageBuffer(image, json, binaryChunk, filePath);
    if (!imageBuffer) {
      images.push({ index, bytes: 0, format: 'unresolved', width: null, height: null });
      continue;
    }
    images.push({ index, bytes: imageBuffer.length, ...readImageDimensions(imageBuffer) });
  }

  return {
    filePath,
    bytes: buffer.length,
    meshes: meshes.length,
    primitives: primitives.length,
    triangles,
    materials: (json.materials ?? []).length,
    textures: (json.textures ?? []).length,
    images,
    extensionsRequired: json.extensionsRequired ?? [],
    extensionsUsed: json.extensionsUsed ?? [],
  };
};

const files = await listGlbFiles(publicDirectory);
if (files.length === 0) {
  console.error('No GLB assets were found under public/.');
  process.exit(1);
}

const failures = [];
console.log('\n3D asset budget report');
for (const filePath of files.sort()) {
  const asset = await inspectGlb(filePath);
  const name = path.relative(root, filePath);
  const geometryCompression = asset.extensionsUsed.some((extension) =>
    ['EXT_meshopt_compression', 'KHR_draco_mesh_compression'].includes(extension),
  );
  const textureCompression = asset.extensionsUsed.includes('KHR_texture_basisu');

  console.log(`\n${name}`);
  console.log(`  file             ${formatKiB(asset.bytes)} / ${formatKiB(budgets.maximumBytes)}`);
  console.log(`  geometry         ${asset.meshes} mesh(es), ${asset.primitives} primitive(s), ${asset.triangles.toLocaleString()} triangles`);
  console.log(`  materials        ${asset.materials}`);
  console.log(`  embedded images  ${asset.images.length}`);
  console.log(`  compression      geometry ${geometryCompression ? 'yes' : 'no'}, textures ${textureCompression ? 'yes' : 'no'}`);

  if (asset.bytes > budgets.maximumBytes) {
    failures.push(`${name} exceeds the GLB byte budget.`);
  }
  if (asset.triangles > budgets.maximumTriangles) {
    failures.push(`${name} exceeds the triangle budget.`);
  }
  if (asset.meshes > budgets.maximumMeshes) {
    failures.push(`${name} exceeds the mesh-count budget.`);
  }
  if (asset.materials > budgets.maximumMaterials) {
    failures.push(`${name} exceeds the material-count budget.`);
  }
  if (asset.extensionsRequired.includes('KHR_materials_pbrSpecularGlossiness')) {
    failures.push(`${name} requires the unsupported KHR_materials_pbrSpecularGlossiness extension.`);
  }

  for (const image of asset.images) {
    const dimensions =
      image.width && image.height ? `${image.width}×${image.height}` : 'unknown dimensions';
    console.log(`    image ${image.index + 1}       ${dimensions}, ${formatKiB(image.bytes)}, ${image.format}`);
    if (
      image.width &&
      image.height &&
      Math.max(image.width, image.height) > budgets.maximumTextureDimension
    ) {
      failures.push(`${name} image ${image.index + 1} exceeds the texture dimension budget.`);
    }
    if (image.bytes > budgets.maximumEmbeddedTextureBytes) {
      failures.push(`${name} image ${image.index + 1} exceeds the embedded texture byte budget.`);
    }
  }
}

if (failures.length > 0) {
  console.error('\n3D asset budget failures:');
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log('\nAll current GLB assets passed the measured budgets.');
