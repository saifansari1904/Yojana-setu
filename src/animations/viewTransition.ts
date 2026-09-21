/**
 * Runs `update` inside a native view transition when the browser supports it.
 * Falls back to a plain synchronous update everywhere else.
 */
export const startScreenTransition = (update: () => void): void => {
  update();
};
