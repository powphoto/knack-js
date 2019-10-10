class DeferredError extends Error {
}

class TimeoutError extends Error {
}

const KNACK_BASE_URL = 'https://api.knack.com/v1';

async function fetchWithTimeout(resource, init, abortAfter) {
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
}

async function generateEvent(key, ref, custom={}) {
  const
    url = new URL(INTEGROMAT_EVENT_ROUTER_URL),
    user = Knack.getUserAttributes();

  url.searchParams.append('key', key);

  const data = {
    'user-email': user.email,
    'event-type': { key, custom },
    'evented-at': new Date().toISOString()
  };

  if (ref) {
    data.ref = ref;
  }

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'accept': 'application/json, text/plain;q=0.9',
      'content-type': 'application/json'
    },
    body: JSON.stringify(data),
    credentials: 'omit',
    redirect: 'error'
  }, INTEGROMAT_TIMEOUT_MS);

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

  return json;
}

async function onInlineReminderClick(event) {
  // if the text is hyperlinked this will prevent the browser from updating the url
  event.preventDefault();
  // prevent the inline editor modal attached to the cell-edit class from popping up
  event.stopImmediatePropagation();

  const { field, record } = event.data;

  try {
    Knack.showSpinner();

    const { custom } = await generateEvent('INLINE_REMINDER', record.orderNum, {
      'template': `day-${field.options.numDays}-reminder`,
      'is-revision': record.isRevision
    });

    const sentAt = moment(custom['sent-at'])
      .tz('America/Chicago')
      .format('MM/DD/YYYY hh:mma');

    $(this).find('span').html(
      `${sentAt}&nbsp;<i class="fa fa-check"></i>`
    );
  }
  catch (err) {
    if (err instanceof TimeoutError) {
      alert('The request took too long to process. Please check back later to see whether or not it was eventually processed. Do not re-submit the request at this time.');
    }
    else if (err instanceof DeferredError) {
      alert('The request was accepted but not immediately processed. Please check back later to see when it was processed. There is no need to re-submit the request at this time.');
    }
    else {
      alert('An unknown error occurred. Please try again later.');
    }

    $(this).find('span').html(
      'Error <i class="fa fa-frown-o"></i>'
    );
  }
  finally {
    Knack.hideSpinner();

    $(this).off('click');
    $(this).removeClass('cell-edit');
    $(this).prevAll('.cell-edit .pow-inline-reminder').each(function() {
      $(this).off('click');
      $(this).removeClass('cell-edit');
      $(this).find('span').html(
        '&nbsp;'
      );
    });
  }
};

function* inlineReminderFieldGenerator(fields) {
  for (const field of fields) {
    if (field.type !== 'date_time') {
      continue;
    }

    const found = /^(\d+)d [Rr]emind/.exec(field.name);
    if (!found) {
      continue;
    }

    yield [
      field.key,
      {
        numDays: parseInt(found[1], 10)
      }
    ];
  }

  return;
}

const renderInventoryTableView = ({ isRevision }) => function(event, view, records) {
  const inlineReminderFields = Array.from(
    inlineReminderFieldGenerator(view.fields)
  ).reverse();

  records.forEach((record) => {
    const
      tr = $(`#${view.key} tr#${record.id}`),
      orderNum = record.field_2_raw;

    for (const [key, options] of inlineReminderFields) {
      const value = record[`${key}_raw`];
      if (value && typeof value === 'object') {
        // the e.g. 14d reminder has already been sent so don't bother showing 7d link
        break;
      }

      const td = tr.find(`td.${key}`);
      td.addClass('cell-edit pow-inline-reminder');
      td.find('span').html(
        '<i class="fa fa-send-o fa-2x"></i>'
      );
      td.click({
        field: {
          key,
          options
        },
        record: {
          isRevision,
          orderNum
        }
      }, onInlineReminderClick);
    }
  });
};

$(document).on('knack-view-render.view_50', renderInventoryTableView({ isRevision: false }));
$(document).on('knack-view-render.view_140', renderInventoryTableView({ isRevision: true }));
