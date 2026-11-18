export function recentRange(days: number) {
  const end = new Date();
  return {
    start: new Date(end.getTime() - days * 86400000).toISOString(),
    end: end.toISOString(),
  };
}
