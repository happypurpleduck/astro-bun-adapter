import { mergeWith } from "es-toolkit";

function mergeArray(base: unknown, other: unknown) {
	if (Array.isArray(base)) {
		return base.concat(other);
	}
}

/** Merge all objects into one. */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function mergeObjects<T extends Record<PropertyKey, any>>(
	base: T,
	...others: T[]
): T {
	return others.reduce(
		(acc, obj) => mergeWith<T, T>(acc, obj, mergeArray),
		base,
	);
}
