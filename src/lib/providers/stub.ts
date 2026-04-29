export async function translateWithStub(
  text: string,
  _from: string,
  to: string,
): Promise<{ translated: string; durationMs: number }> {
  return {
    translated: `[${to.toUpperCase()}] ${text}`,
    durationMs: 0,
  };
}

export async function translateBatchStub(
  texts: string[],
  _from: string,
  to: string,
): Promise<{ translated: string[]; durationMs: number }> {
  const tag = `[${to.toUpperCase()}] `;
  return {
    translated: texts.map((t) => tag + t),
    durationMs: 0,
  };
}
