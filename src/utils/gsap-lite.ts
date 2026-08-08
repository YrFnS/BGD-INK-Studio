type AnimationTarget = string | Element | ArrayLike<Element> | Iterable<Element> | null | undefined;

type ScopeTarget = Element | { current: Element | null } | null | undefined;

type MotionValue = number | string;

interface MotionVars {
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;
  opacity?: MotionValue;
  x?: number;
  y?: number;
  xPercent?: number;
  yPercent?: number;
  scale?: number;
  scaleX?: number;
  rotate?: number;
  skewY?: number;
  color?: string;
  clearProps?: string;
  overwrite?: string;
  onComplete?: () => void;
}

interface MotionContextState {
  scope: Element | null;
  animations: Set<Animation>;
  timers: Set<number>;
  snapshots: Map<HTMLElement, string>;
}

interface TimelineOptions {
  defaults?: MotionVars;
}

interface TimelineLike {
  from(target: AnimationTarget, vars: MotionVars, position?: number | string): TimelineLike;
  to(target: AnimationTarget, vars: MotionVars, position?: number | string): TimelineLike;
  fromTo(
    target: AnimationTarget,
    fromVars: MotionVars,
    toVars: MotionVars,
    position?: number | string,
  ): TimelineLike;
}

const DEFAULT_DURATION = 0.5;
let activeContext: MotionContextState | null = null;

const easeToCss = (ease?: string): string => {
  if (!ease) return 'ease';
  if (ease.startsWith('elastic.out')) return 'cubic-bezier(.16,1,.3,1)';
  if (ease.startsWith('back.out')) return 'cubic-bezier(.34,1.56,.64,1)';

  const easings: Record<string, string> = {
    'power2.inOut': 'cubic-bezier(.65,0,.35,1)',
    'power3.out': 'cubic-bezier(.22,1,.36,1)',
    'power4.out': 'cubic-bezier(.16,1,.3,1)',
    'power4.inOut': 'cubic-bezier(.76,0,.24,1)',
    'expo.inOut': 'cubic-bezier(.87,0,.13,1)',
  };

  return easings[ease] ?? 'ease';
};

const resolveScope = (scope: ScopeTarget): Element | null => {
  if (!scope) return null;
  if ('current' in scope) return scope.current;
  return scope;
};

const isElement = (value: unknown): value is Element =>
  typeof Element !== 'undefined' && value instanceof Element;

const resolveTargets = (target: AnimationTarget): Element[] => {
  if (!target) return [];

  if (typeof target === 'string') {
    const root = activeContext?.scope ?? (typeof document !== 'undefined' ? document : null);
    return root ? Array.from(root.querySelectorAll(target)) : [];
  }

  if (isElement(target)) return [target];

  if (Symbol.iterator in Object(target)) {
    return Array.from(target as Iterable<Element>).filter(isElement);
  }

  if ('length' in Object(target)) {
    return Array.from(target as ArrayLike<Element>).filter(isElement);
  }

  return [];
};

const resolveHtmlTargets = (target: AnimationTarget): HTMLElement[] =>
  resolveTargets(target).filter(
    (element): element is HTMLElement =>
      typeof HTMLElement !== 'undefined' && element instanceof HTMLElement,
  );

const rememberInlineStyle = (element: HTMLElement): void => {
  const context = activeContext;
  if (context && !context.snapshots.has(element)) {
    context.snapshots.set(element, element.style.cssText);
  }
};

const registerTimer = (callback: () => void, delayMs: number): number => {
  const timer = globalThis.setTimeout(callback, Math.max(0, delayMs)) as unknown as number;
  activeContext?.timers.add(timer);
  return timer;
};

const registerAnimation = (animation: Animation): void => {
  activeContext?.animations.add(animation);
};

const getComputed = (element: Element): CSSStyleDeclaration | null => {
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return null;
  return window.getComputedStyle(element);
};

const hasPixelTranslation = (vars: MotionVars): boolean =>
  vars.x !== undefined || vars.y !== undefined;

const hasNonPixelTransformVars = (vars: MotionVars): boolean =>
  vars.xPercent !== undefined ||
  vars.yPercent !== undefined ||
  vars.scale !== undefined ||
  vars.scaleX !== undefined ||
  vars.rotate !== undefined ||
  vars.skewY !== undefined;

const buildTransform = (vars: MotionVars): string => {
  const parts: string[] = [];

  if (vars.xPercent !== undefined || vars.yPercent !== undefined) {
    parts.push(`translate(${vars.xPercent ?? 0}%, ${vars.yPercent ?? 0}%)`);
  }
  if (vars.rotate !== undefined) parts.push(`rotate(${vars.rotate}deg)`);
  if (vars.skewY !== undefined) parts.push(`skewY(${vars.skewY}deg)`);
  if (vars.scale !== undefined) parts.push(`scale(${vars.scale})`);
  if (vars.scaleX !== undefined) parts.push(`scaleX(${vars.scaleX})`);

  return parts.join(' ');
};

const readTranslate = (element: HTMLElement): { x: number; y: number } => {
  const current = element.dataset.motionTranslate?.split(',').map(Number) ?? [];
  return {
    x: Number.isFinite(current[0]) ? (current[0] as number) : 0,
    y: Number.isFinite(current[1]) ? (current[1] as number) : 0,
  };
};

const writeTranslate = (element: HTMLElement, x: number, y: number): void => {
  rememberInlineStyle(element);
  element.dataset.motionTranslate = `${x},${y}`;
  element.style.setProperty('translate', `${x}px ${y}px`);
};

const clearRequestedProperties = (element: HTMLElement, clearProps?: string): void => {
  if (!clearProps) return;
  const requested = new Set(clearProps.split(',').map((property) => property.trim()));

  if (requested.has('all')) {
    element.removeAttribute('style');
    delete element.dataset.motionTranslate;
    return;
  }

  if (requested.has('transform')) {
    element.style.removeProperty('transform');
    element.style.removeProperty('translate');
    delete element.dataset.motionTranslate;
  }
  if (requested.has('opacity')) element.style.removeProperty('opacity');
  if (requested.has('color')) element.style.removeProperty('color');
};

const applyVarsImmediately = (element: HTMLElement, vars: MotionVars): void => {
  rememberInlineStyle(element);
  const current = readTranslate(element);

  if (hasPixelTranslation(vars)) {
    writeTranslate(element, vars.x ?? current.x, vars.y ?? current.y);
  }
  if (vars.opacity !== undefined) element.style.opacity = String(vars.opacity);
  if (vars.color !== undefined) element.style.color = vars.color;
  if (hasNonPixelTransformVars(vars)) {
    element.style.transform = buildTransform(vars) || 'none';
  }

  clearRequestedProperties(element, vars.clearProps);
};

const createKeyframes = (
  element: HTMLElement,
  vars: MotionVars,
  direction: 'from' | 'to',
): { frames: Keyframe[]; applyFinal: () => void } => {
  const computed = getComputed(element);
  const currentOpacity = (computed?.opacity ?? element.style.opacity) || '1';
  const currentColor = computed?.color ?? element.style.color;
  const currentTransform =
    computed?.transform && computed.transform !== 'none' ? computed.transform : 'none';
  const currentTranslation = readTranslate(element);
  const currentTranslate = `${currentTranslation.x}px ${currentTranslation.y}px`;
  const targetTransform = buildTransform(vars) || 'none';

  const start: Keyframe = {};
  const end: Keyframe = {};

  if (direction === 'from') {
    if (vars.opacity !== undefined) start.opacity = vars.opacity;
    if (vars.color !== undefined) start.color = vars.color;
    if (hasPixelTranslation(vars)) {
      start.translate = `${vars.x ?? currentTranslation.x}px ${vars.y ?? currentTranslation.y}px`;
      end.translate = currentTranslate;
    }
    if (hasNonPixelTransformVars(vars)) {
      start.transform = targetTransform;
      end.transform = currentTransform;
    }

    if (vars.opacity !== undefined) end.opacity = currentOpacity;
    if (vars.color !== undefined) end.color = currentColor;
  } else {
    if (vars.opacity !== undefined) {
      start.opacity = currentOpacity;
      end.opacity = vars.opacity;
    }
    if (vars.color !== undefined) {
      start.color = currentColor;
      end.color = vars.color;
    }
    if (hasPixelTranslation(vars)) {
      start.translate = currentTranslate;
      end.translate = `${vars.x ?? currentTranslation.x}px ${vars.y ?? currentTranslation.y}px`;
    }
    if (hasNonPixelTransformVars(vars)) {
      start.transform = currentTransform;
      end.transform = targetTransform;
    }
  }

  const applyFinal = () => {
    if (direction !== 'to') return;
    applyVarsImmediately(element, vars);
  };

  return { frames: [start, end], applyFinal };
};

const animateElement = (
  element: HTMLElement,
  vars: MotionVars,
  direction: 'from' | 'to',
  extraDelaySeconds = 0,
): void => {
  const durationMs = Math.max(0, vars.duration ?? DEFAULT_DURATION) * 1000;
  const delayMs = Math.max(0, (vars.delay ?? 0) + extraDelaySeconds) * 1000;
  const { frames, applyFinal } = createKeyframes(element, vars, direction);
  const run = () => {
    if (typeof element.animate === 'function') {
      const animation = element.animate(frames, {
        duration: durationMs,
        easing: easeToCss(vars.ease),
        fill: direction === 'to' ? 'forwards' : 'none',
      });
      registerAnimation(animation);
      void animation.finished
        .then(() => {
          applyFinal();
          animation.cancel();
          vars.onComplete?.();
        })
        .catch(() => undefined);
    } else {
      applyFinal();
      vars.onComplete?.();
    }
  };

  registerTimer(run, delayMs);
};

const animateTargets = (
  target: AnimationTarget,
  vars: MotionVars,
  direction: 'from' | 'to',
  timelineDelay = 0,
): number => {
  const elements = resolveHtmlTargets(target);
  const stagger = Math.max(0, vars.stagger ?? 0);

  elements.forEach((element, index) => {
    animateElement(element, vars, direction, timelineDelay + stagger * index);
  });

  return elements.length;
};

const animateFromToTargets = (
  target: AnimationTarget,
  fromVars: MotionVars,
  toVars: MotionVars,
  timelineDelay = 0,
): number => {
  const elements = resolveHtmlTargets(target);
  const stagger = Math.max(0, toVars.stagger ?? 0);

  elements.forEach((element, index) => {
    applyVarsImmediately(element, fromVars);
    animateElement(element, toVars, 'to', timelineDelay + stagger * index);
  });

  return elements.length;
};

const parseTimelinePosition = (position: number | string | undefined, cursor: number): number => {
  if (typeof position === 'number') return Math.max(0, position);
  if (!position) return cursor;

  const relative = position.match(/^([+-])=(\d*\.?\d+)$/);
  if (!relative) return cursor;

  const amount = Number(relative[2]);
  return Math.max(0, relative[1] === '-' ? cursor - amount : cursor + amount);
};

class LiteTimeline implements TimelineLike {
  private cursor = 0;
  private readonly defaults: MotionVars;

  constructor(options?: TimelineOptions) {
    this.defaults = options?.defaults ?? {};
  }

  private measureEnd(start: number, vars: MotionVars, count: number): void {
    const stagger = Math.max(0, vars.stagger ?? 0);
    const duration = Math.max(0, vars.duration ?? DEFAULT_DURATION);
    const delay = Math.max(0, vars.delay ?? 0);
    this.cursor = Math.max(
      this.cursor,
      start + delay + duration + stagger * (Math.max(1, count) - 1),
    );
  }

  private add(
    direction: 'from' | 'to',
    target: AnimationTarget,
    vars: MotionVars,
    position?: number | string,
  ): this {
    const merged = { ...this.defaults, ...vars };
    const start = parseTimelinePosition(position, this.cursor);
    const count = animateTargets(
      target,
      { ...merged, delay: 0 },
      direction,
      start + (merged.delay ?? 0),
    );
    this.measureEnd(start, merged, count);
    return this;
  }

  from(target: AnimationTarget, vars: MotionVars, position?: number | string): this {
    return this.add('from', target, vars, position);
  }

  to(target: AnimationTarget, vars: MotionVars, position?: number | string): this {
    return this.add('to', target, vars, position);
  }

  fromTo(
    target: AnimationTarget,
    fromVars: MotionVars,
    toVars: MotionVars,
    position?: number | string,
  ): this {
    const merged = { ...this.defaults, ...toVars };
    const start = parseTimelinePosition(position, this.cursor);
    const count = animateFromToTargets(
      target,
      fromVars,
      { ...merged, delay: 0 },
      start + (merged.delay ?? 0),
    );
    this.measureEnd(start, merged, count);
    return this;
  }
}

const context = (callback: () => void, scope?: ScopeTarget) => {
  const previous = activeContext;
  const state: MotionContextState = {
    scope: resolveScope(scope),
    animations: new Set(),
    timers: new Set(),
    snapshots: new Map(),
  };

  activeContext = state;
  try {
    callback();
  } finally {
    activeContext = previous;
  }

  return {
    revert: () => {
      state.timers.forEach((timer) => globalThis.clearTimeout(timer));
      state.animations.forEach((animation) => animation.cancel());
      state.snapshots.forEach((style, element) => {
        element.style.cssText = style;
        delete element.dataset.motionTranslate;
      });
      state.timers.clear();
      state.animations.clear();
      state.snapshots.clear();
    },
  };
};

const timeline = (options?: TimelineOptions): TimelineLike => new LiteTimeline(options);

const from = (target: AnimationTarget, vars: MotionVars): void => {
  animateTargets(target, vars, 'from');
};

const to = (target: AnimationTarget, vars: MotionVars): void => {
  animateTargets(target, vars, 'to');
};

const fromTo = (target: AnimationTarget, fromVars: MotionVars, toVars: MotionVars): void => {
  animateFromToTargets(target, fromVars, toVars, Math.max(0, toVars.delay ?? 0));
};

const set = (target: AnimationTarget, vars: MotionVars): void => {
  resolveHtmlTargets(target).forEach((element) => applyVarsImmediately(element, vars));
};

const quickTo = (
  target: Element,
  property: 'x' | 'y',
  options?: Pick<MotionVars, 'duration' | 'ease'>,
): ((value: number) => void) => {
  const element = target as HTMLElement;
  const duration = Math.max(0, options?.duration ?? DEFAULT_DURATION);

  return (value: number) => {
    const current = readTranslate(element);
    rememberInlineStyle(element);
    element.style.transition = `translate ${duration}s ${easeToCss(options?.ease)}`;
    writeTranslate(
      element,
      property === 'x' ? value : current.x,
      property === 'y' ? value : current.y,
    );
  };
};

const gsapLite = {
  context,
  timeline,
  from,
  to,
  fromTo,
  set,
  quickTo,
};

export default gsapLite;
