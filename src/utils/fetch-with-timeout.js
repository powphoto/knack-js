class TimeoutError extends Error {
}

export default async function fetchWithTimeout(resource, init, abortAfter) {
  const
    controller = new AbortController(),
    request = fetch(resource, { ...init, signal: controller.signal }),
    timeoutId = setTimeout(() => controller.abort(), abortAfter);

  try {
    return await request;
  }
  catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new TimeoutError();
    }

    // some other kind of network issue
    throw err;
  }
  finally {
    clearTimeout(timeoutId);
  }
};

export { TimeoutError };
