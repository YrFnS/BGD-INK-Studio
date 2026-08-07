import { readFileSync, writeFileSync } from 'node:fs';

const filePath = 'src/services/drafts/indexedDb.ts';
let content = readFileSync(filePath, 'utf8');

const oldMessage =
  "        'Another tab is blocking the design database. Close older BGD/INK tabs and try again.',";
const nextMessage =
  '        `Another tab is blocking the design database. Close older ${BRAND.displayName} tabs and try again.`,';

if (!content.includes(oldMessage) && !content.includes(nextMessage)) {
  throw new Error('The IndexedDB blocked-tab message was not found.');
}

content = content.replace(oldMessage, nextMessage);
writeFileSync(filePath, content);
