import { flatArray } from '.';

export function startObserve(elementSelectors = [], callback, options = {}) {
  const defaults = {
    root: null,
    rootMargin: '0px 0px 0px 0px',
    threshold: 0,
  };
  const observer = new IntersectionObserver(callback, {
    ...defaults,
    ...options,
  });
  const elements = flatArray(
    elementSelectors.map((v) => [...document.querySelectorAll(v)])
  );
  elements.forEach((e) => observer.observe(e));
  return {
    observer,
    cancel() {
      elements.forEach((e) => observer.unobserve(e));
      observer.disconnect();
    },
  };
}
