/* global Knack */
import $ from 'jquery';
import {
  get as _get
} from 'lodash';
import moment from 'moment-timezone';

import config from '..';
import { dedasherizeKeys } from '../utils/inflectors';

const
  FIELD_MAP = {
    // TODO: This is specific to our project...
    order: {
      number: 2,
      hasMultipleDueDates: 94,
      hold30d: {
        startAt: 98,
        endAt: 99
      }
    }
  },
  TIMEZONE_MAP = {
    'Central Time (US & Canada)': 'America/Chicago'
    // ...TODO...
  };

function* formatEntryGenerator({ dateFormat, timeFormat }) {
  switch (dateFormat) {
    case 'mm/dd/yyyy':
      yield ['dateFormat', 'MM/DD/YYYY'];
      break;
    case 'M D, yyyy':
      yield ['dateFormat', 'MMMM Do, YYYY'];
      break;
    case 'dd/mm/yyyy':
      yield ['dateFormat', 'DD/MM/YYYY'];
      break;
  }

  switch (timeFormat) {
    case 'HH:MM am':
      yield ['timeFormat', 'h:mma'];
      break;
    case 'HH MM (military)':
      yield ['timeFormat', 'HHmm'];
      break;
  }
}

function mapFormats() {
  return Object.fromEntries(formatEntryGenerator(...arguments));
}

function buildFormatString() {
  return Object.values(mapFormats(...arguments)).join(' ');
}

export const isDateTime = o => o && typeof o === 'object' && o.hasOwnProperty('iso_timestamp');

export function formatDateTime(o, rawFormat) {
  const
    { dateFormat, timeFormat } = dedasherizeKeys(rawFormat),
    m = moment.isMoment(o) ? o : moment(o);

  return m.format(buildFormatString({ dateFormat, timeFormat }));
}

export function registerHooks(hooks) {
  Object.entries(hooks).forEach(([eventName, namespaces]) => {
    Object.entries(namespaces).forEach(([namespace, method]) => {
      $(document).on(`${eventName}.${namespace}`, method);
    });
  });
}

export function setTZ() {
  const
    original = Knack.app.attributes.settings.timezone,
    mapped = TIMEZONE_MAP[original];

  if (mapped) {
    moment.tz.setDefault(mapped);
  }
  else {
    console.error(`** unknown/unmapped Knack timezone: ${original}`);
  }
}

export function mapField(path, context) {
  const fieldMap = context && (context in FIELD_MAP)
    ? FIELD_MAP[context]
    : FIELD_MAP;

  const [id, options] = [].concat(_get(fieldMap, path, []));

  if (!id) {
    throw new Error(`** undefined path: ${path}`);
  }

  const
    key = `field_${id}`,
    raw = !(options && typeof options === 'object' && 'raw' in options) || options.raw;

  return {
    key,
    ref: key + (raw ? '_raw' : ''),
    options: {
      raw
    }
  };
}
