/**
 * Where the companion shows up and how it behaves around typing. Plain data, so a route can
 * be added or excluded without touching components.
 */
/** Pages where the learner types, so the companion can be calm or hidden while keys are pressed. */
export const TYPING_ROUTES: RegExp[] = [/^\/learn\/(english|khmer)\/?$/, /^\/games\/[^/]+/, /^\/setup\/?$/];
/** Pages that never show the companion (distraction-free modes). */
export const PET_HIDDEN_ROUTES: RegExp[] = [];
/** How long after the last key press the learner still counts as "typing". */
export const TYPING_GRACE_MS = 3500;

export const isTypingRoute = (pathname: string) => TYPING_ROUTES.some((r) => r.test(pathname));
export const isPetHiddenRoute = (pathname: string) => PET_HIDDEN_ROUTES.some((r) => r.test(pathname));

/** Sprite sizes in px. Phones are capped so the pet never crowds the screen. */
export const PET_SIZES = { sm: 64, md: 84, lg: 108 } as const;
export const MOBILE_MAX_SIZE = 84;

/** Actions: a click on one of these is meant for it, so the pet does not also react to it. */
export const ACTION_SELECTOR = 'a,button,select,summary,[role="button"],[role="radio"],[role="checkbox"],[role="menuitem"]';
/** Everything clickable or typeable. The pointer is never styled as a pet cursor over these. */
export const INTERACTIVE_SELECTOR = 'a,button,input,textarea,select,summary,label,[role="button"],[role="radio"],[role="checkbox"],[role="menuitem"],[contenteditable="true"],[tabindex]:not([tabindex="-1"])';
