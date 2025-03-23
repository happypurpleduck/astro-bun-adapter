import { mergeWith } from "es-toolkit";
function mergeArray(base, other) {
    if (Array.isArray(base)) {
        return base.concat(other);
    }
}
/** Merge all objects into one. */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function mergeObjects(base, ...others) {
    return others.reduce((acc, obj) => mergeWith(acc, obj, mergeArray), base);
}
