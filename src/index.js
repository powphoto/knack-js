import config from '../config';
import { registerHooks } from './knack';

export function hone(callback) {
  if (callback && typeof callback === 'function') {
    callback(config);
  }

  registerHooks(config.knack.hooks);
}

export default config;
