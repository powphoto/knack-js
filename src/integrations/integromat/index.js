/* global Knack */

import config from '../..';
import fetchWithTimeout, { TimeoutError } from '../../utils/fetch-with-timeout';
import { dasherizeKeys, dedasherizeKeys } from '../../utils/inflectors';

export class DeferredError extends Error {
}

export default async function generateEvent(key, ref, custom={}) {
  const
    url = new URL(config.integrations.integromat.baseUrl),
    user = Knack.getUserAttributes();

  const { method, path, timeout } = Object.assign({
      method: 'POST',
      timeout: 40_000
    },
    config.integrations.integromat.eventDefaults,
    config.integrations.integromat.events[key]
  );

  url.pathname += path;

  const data = {
    userEmail: user.email,
    eventType: { key, custom },
    eventedAt: new Date().toISOString()
  };

  if (ref) {
    data.ref = ref;
  }

  const res = await fetchWithTimeout(url, {
    method,
    headers: {
      'accept': 'application/json, text/plain;q=0.9',
      'content-type': 'application/json'
    },
    body: JSON.stringify(dasherizeKeys(data)),
    credentials: 'omit',
    redirect: 'error'
  }, timeout);

  if (!res.ok) {
    throw new Error(res.statusText);
  }

  if (!res.headers.has('content-type') || !res.headers.get('content-type').startsWith('application/json')) {
    const text = await res.text();

    if (text.includes('Accepted')) {
      throw new DeferredError();
    }

    throw new Error(`Unknown and unhandleable ${res.status} response from Integromat: ${text}`);
  }

  const json = await res.json();

  if (!('key' in json)) {
    throw new Error(`Event type missing in ${res.status} response from Integromat: expected ${key}`);
  }

  if (json.key !== key) {
    throw new Error(`Event type mismatch in ${res.status} response from Integromat: expected ${key}, got ${json.key}`);
  }

  return dedasherizeKeys(json);
};
