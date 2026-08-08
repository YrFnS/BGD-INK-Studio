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

const replaceFileFragment = async (relativePath, before, after) => {
  const filePath = path.join(root, relativePath);
  const source = await readFile(filePath, 'utf8');
  if (!source.includes(before)) {
    throw new Error(`${relativePath}: expected post-migration test fragment was not found`);
  }
  await writeFile(filePath, source.replace(before, after));
};

const script = decodedScript
  .toString('utf8')
  .replaceAll("    }, [draftId],\n  );", "    },\n    [draftId],\n  );")
  .replaceAll('services/drafts/persistenceCoordinator', 'persistenceCoordinator');

await writeFile(temporaryScriptPath, script);
await import(pathToFileURL(temporaryScriptPath).href);

await replaceFileFragment(
  'src/routing/appRouter.test.ts',
  `  it('pushes and replaces History API routes', () => {
    const { result } = renderHook(() => useAppRouter());

    act(() => result.current.navigate(routes.guide()));
    expect(window.location.pathname).toBe('/guide');
    expect(result.current.route).toEqual(routes.guide());

    act(() => result.current.navigate(routes.catalog(), { replace: true, scroll: false }));
    expect(window.location.pathname).toBe('/catalog');
    expect(result.current.route).toEqual(routes.catalog());
  });`,
  `  it('pushes and replaces History API routes after pending draft data is flushed', async () => {
    const { result } = renderHook(() => useAppRouter());

    await act(async () => {
      await result.current.navigate(routes.guide());
    });
    expect(window.location.pathname).toBe('/guide');
    expect(result.current.route).toEqual(routes.guide());

    await act(async () => {
      await result.current.navigate(routes.catalog(), { replace: true, scroll: false });
    });
    expect(window.location.pathname).toBe('/catalog');
    expect(result.current.route).toEqual(routes.catalog());
  });`,
);

await replaceFileFragment(
  'src/routing/appRouter.test.ts',
  `    window.history.pushState(null, '', '/checkout/draft-abc');
    act(() => window.dispatchEvent(new PopStateEvent('popstate')));

    expect(result.current.route).toEqual(routes.checkout('draft-abc'));
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' }));`,
  `    window.history.pushState(null, '', '/checkout/draft-abc');
    await act(async () => {
      window.dispatchEvent(new PopStateEvent('popstate'));
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.route).toEqual(routes.checkout('draft-abc')));
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' }));`,
);

await replaceFileFragment(
  'src/services/drafts/indexedDb.test.ts',
  '    expect(restored?.version).toBe(5);',
  '    expect(restored?.version).toBe(6);\n    expect(restored?.revision).toBeGreaterThan(0);',
);

await rm(temporaryScriptPath, { force: true });
await rm(payloadPath, { force: true });
await rm(runnerPath, { force: true });
