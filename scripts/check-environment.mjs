import { readFileSync } from 'node:fs';

const expectedNode = readFileSync('.nvmrc', 'utf8').trim();
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const expectedNpm = String(packageJson.packageManager ?? '').replace(/^npm@/, '');
const currentNode = process.versions.node;
const npmUserAgent = process.env.npm_config_user_agent ?? '';
const currentNpm = npmUserAgent.match(/npm\/([^\s]+)/)?.[1] ?? null;

const failures = [];

if (currentNode !== expectedNode) {
  failures.push(`Node.js ${expectedNode} is required; received ${currentNode}.`);
}

if (currentNpm && currentNpm !== expectedNpm) {
  failures.push(`npm ${expectedNpm} is required; received ${currentNpm}.`);
}

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`ERROR  ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Environment validated: Node.js ${currentNode}, npm ${currentNpm ?? expectedNpm}.`);
  console.log('No application secrets or remote-backend environment variables are required.');
}
