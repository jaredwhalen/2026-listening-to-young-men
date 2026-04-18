import { browser } from '$app/environment';

export default function getValueFromCSSVar(varName) {
    if (!browser) return null; // or return a fallback value
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}
