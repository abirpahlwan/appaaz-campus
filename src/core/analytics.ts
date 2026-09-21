// @ts-nocheck
/* Ported from the legacy single-file script (mechanical split). */



/* One call site for everything worth knowing about a playable page:
   did they start, what did they read, did they finish, did they bail to the
   plain version. No-ops entirely when analytics is switched off. */
export function track(name, extra){}