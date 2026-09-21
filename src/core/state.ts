// Shared mutable state ($S) and forward-reference registry ($R) for the ported legacy modules.
export const $S: any = {};
export const $R: any = {};
(window as any).__campus = { $S, $R };
