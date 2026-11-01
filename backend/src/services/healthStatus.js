export function getHealthResponse(
  databaseReadyState,
  uptimeSeconds = Math.floor(process.uptime()),
  timestamp = new Date().toISOString(),
  { redisConfigured = false, redisReady = true } = {},
) {
  const connected = databaseReadyState === 1;
  const rateLimitStoreReady = !redisConfigured || redisReady;
  const healthy = connected && rateLimitStoreReady;
  return {
    statusCode: healthy ? 200 : 503,
    body: {
      success: healthy,
      data: {
        status: healthy ? 'ok' : 'degraded',
        database: { connected },
        rateLimitStore: { configured: redisConfigured, connected: redisConfigured ? redisReady : null },
        uptimeSeconds,
        timestamp,
      },
    },
  };
}
