export function createGracefulShutdown({
  server,
  closeDatabase,
  closeRedis,
  timeoutMs = 10000,
  setExitCode = (code) => { process.exitCode = code; },
  forceExit = (code) => process.exit(code),
  log = (message) => process.stderr.write(`${message}\n`),
}) {
  let shutdownPromise;

  return (signal, requestedExitCode = 0) => {
    if (shutdownPromise) return shutdownPromise;
    log(`${signal} received; shutting down.`);

    shutdownPromise = new Promise((resolve) => {
      let finished = false;
      const timeout = setTimeout(() => {
        server.closeAllConnections?.();
        log('Shutdown timed out; closing active HTTP connections.');
        forceExit(1);
      }, timeoutMs).unref();

      const finish = async (serverError) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        const results = await Promise.allSettled([closeDatabase(), closeRedis()]);
        const cleanupFailed = results.some((result) => result.status === 'rejected');
        if (serverError) log(`HTTP server close failed (${serverError.name || 'Error'}).`);
        for (const result of results) {
          if (result.status === 'rejected') log(`Resource cleanup failed (${result.reason?.name || 'Error'}).`);
        }
        const exitCode = serverError || cleanupFailed ? 1 : requestedExitCode;
        setExitCode(exitCode);
        resolve({ exitCode });
      };

      try { server.close((error) => { void finish(error); }); }
      catch (error) { void finish(error); }
    });

    return shutdownPromise;
  };
}
