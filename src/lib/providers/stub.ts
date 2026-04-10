export async function translateWithStub(
  text: string,
  _from: string,
  to: string,
): Promise<{
  translated: string;
  durationMs: number;
}> {
  const start = Date.now();
  await new Promise((r) => setTimeout(r, 100)); // simulate latency
  return {
    translated: `[${to.toUpperCase()}] ${text}`,
    durationMs: Date.now() - start,
  };
}
