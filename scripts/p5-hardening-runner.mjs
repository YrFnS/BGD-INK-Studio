import { createHash } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = process.cwd();
const payloadPath = path.join(root, 'scripts/p5-hardening.mjs.gz.b64');
const runnerPath = fileURLToPath(import.meta.url);
const temporaryScriptPath = path.join(root, '.p5-hardening-validated.mjs');
const payload = (await readFile(payloadPath, 'utf8')).trim();
const decodedScript = gunzipSync(Buffer.from(payload, 'base64'));
const digest = createHash('sha256').update(decodedScript).digest('hex');

if (digest !== '3122cf242b112f8eb0a878a446923e2bc2f2f73e43c910021f889b70dead3968') {
  throw new Error(`Unexpected P5 migration payload digest: ${digest}`);
}

const script = decodedScript
  .toString('utf8')
  .replaceAll("    }, [draftId],\n  );", "    },\n    [draftId],\n  );");

await writeFile(temporaryScriptPath, script);
await import(pathToFileURL(temporaryScriptPath).href);
await rm(temporaryScriptPath, { force: true });
await rm(payloadPath, { force: true });
await rm(runnerPath, { force: true });
