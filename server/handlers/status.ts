export function handleStatusRequest(): Response {
  const hasEnvKey = Boolean(process.env.TYPESAFE_API_KEY?.trim());
  return Response.json({ hasEnvKey, model: 'jev-latest' });
}
