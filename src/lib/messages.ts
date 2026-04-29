// Helpers for translating nested message objects (i18n-style trees) by
// flattening to a string array, batch-translating, then re-hydrating.

export type MessageValue = string | MessageObject | MessageValue[];
export interface MessageObject {
  [key: string]: MessageValue;
}

export interface FlatEntry {
  path: (string | number)[];
  value: string;
}

export function flattenMessages(obj: MessageValue): FlatEntry[] {
  const out: FlatEntry[] = [];
  walk(obj, [], out);
  return out;
}

function walk(node: MessageValue, path: (string | number)[], out: FlatEntry[]) {
  if (typeof node === "string") {
    out.push({ path: [...path], value: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, idx) => walk(item, [...path, idx], out));
    return;
  }
  if (node && typeof node === "object") {
    for (const key of Object.keys(node)) {
      walk(node[key], [...path, key], out);
    }
  }
}

export function unflattenMessages(
  template: MessageValue,
  entries: FlatEntry[],
  translations: string[],
): MessageValue {
  // Deep clone template to keep non-string nodes intact.
  const clone = deepClone(template);
  for (let i = 0; i < entries.length; i++) {
    setByPath(clone, entries[i].path, translations[i]);
  }
  return clone;
}

function deepClone(v: MessageValue): MessageValue {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(deepClone);
  if (v && typeof v === "object") {
    const out: MessageObject = {};
    for (const k of Object.keys(v)) out[k] = deepClone(v[k]);
    return out;
  }
  return v;
}

function setByPath(
  root: MessageValue,
  path: (string | number)[],
  value: string,
): void {
  if (path.length === 0) return;
  let cursor: MessageValue = root;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (Array.isArray(cursor)) {
      cursor = cursor[key as number];
    } else if (cursor && typeof cursor === "object") {
      cursor = (cursor as MessageObject)[key as string];
    } else {
      return;
    }
  }
  const last = path[path.length - 1];
  if (Array.isArray(cursor)) {
    cursor[last as number] = value;
  } else if (cursor && typeof cursor === "object") {
    (cursor as MessageObject)[last as string] = value;
  }
}

export function countStrings(v: MessageValue): number {
  if (typeof v === "string") return 1;
  if (Array.isArray(v)) return v.reduce((s, n) => s + countStrings(n), 0);
  if (v && typeof v === "object") {
    return Object.values(v).reduce((s: number, n) => s + countStrings(n), 0);
  }
  return 0;
}

export function setNestedDotPath(
  obj: MessageObject,
  dotPath: string,
  value: string,
): void {
  const keys = dotPath.split(".");
  let cursor: MessageObject = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (
      !cursor[key] ||
      typeof cursor[key] !== "object" ||
      Array.isArray(cursor[key])
    ) {
      cursor[key] = {};
    }
    cursor = cursor[key] as MessageObject;
  }
  cursor[keys[keys.length - 1]] = value;
}
