const isPlainPrimaryClick = (event: MouseEvent): boolean =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const getAnchorFromEvent = (event: MouseEvent): HTMLAnchorElement | null => {
  const target = event.target;
  if (!(target instanceof Element)) return null;

  const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
  if (!anchor || anchor.hasAttribute('download')) return null;
  if (anchor.target && anchor.target !== '_self') return null;
  return anchor;
};

export const installAnchorNavigation = (
  documentTarget: Document = document,
  windowTarget: Window = window,
): (() => void) => {
  const handleAnchorClick = (event: MouseEvent) => {
    if (event.defaultPrevented || !isPlainPrimaryClick(event)) return;

    const anchor = getAnchorFromEvent(event);
    const hash = anchor?.hash;
    if (!anchor || !hash || hash === '#') return;

    let targetId: string;
    try {
      targetId = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }

    const destination = documentTarget.getElementById(targetId);
    if (!destination) return;

    event.preventDefault();
    const reducedMotion = windowTarget.matchMedia('(prefers-reduced-motion: reduce)').matches;
    destination.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
      inline: 'nearest',
    });

    const nextUrl = `${windowTarget.location.pathname}${windowTarget.location.search}${hash}`;
    windowTarget.history.replaceState(windowTarget.history.state, '', nextUrl);
  };

  documentTarget.addEventListener('click', handleAnchorClick);
  return () => documentTarget.removeEventListener('click', handleAnchorClick);
};
