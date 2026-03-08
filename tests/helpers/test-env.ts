export function installTestDomGlobals() {
  if (typeof window === "undefined") {
    return;
  }

  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  }

  if (!window.scrollTo) {
    window.scrollTo = () => undefined;
  }
}
