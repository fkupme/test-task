import type { Router, RouteLocationNormalized } from "vue-router";

export default defineNuxtPlugin((nuxtApp) => {
  const stackKey = "__nav_stack__";

  const normalize = (path: string): string => {
    try {
      const url = new URL(path, window.location.origin);
      return url.pathname;
    } catch {
      return path.split("?")[0].split("#")[0];
    }
  };

  const getStack = (): string[] => {
    try {
      return JSON.parse(sessionStorage.getItem(stackKey) || "[]");
    } catch (_) {
      return [];
    }
  };

  const setStack = (stack: string[]) => {
    try {
      sessionStorage.setItem(stackKey, JSON.stringify(stack.slice(-50)));
    } catch (_) {
      // ignore quota errors silently
    }
  };

  const router = nuxtApp.vueApp.config.globalProperties.$router as Router;

  router.afterEach((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
    if (!from?.fullPath) return;
    if (to.fullPath === from.fullPath) return;
    const stack = getStack();
    const fromNorm = normalize(from.fullPath);
    if (stack.length === 0 || normalize(stack[stack.length - 1]) !== fromNorm) {
      stack.push(fromNorm);
      setStack(stack);
    }
  });

  return {
    provide: {
      navstack: {
        pop: (currentPath?: string): string | null => {
          const stack = getStack();
          const currentNorm = currentPath ? normalize(currentPath) : undefined;
          while (stack.length) {
            const prev = stack.pop()!;
            if (!currentNorm || normalize(prev) !== currentNorm) {
              setStack(stack);
              return prev;
            }
          }
          setStack(stack);
          return null;
        },
        clear: () => setStack([]),
      },
    },
  };
}); 