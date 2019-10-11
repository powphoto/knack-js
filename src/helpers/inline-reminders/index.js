/* global Knack */

import $ from 'jquery';
import moment from 'moment';

import generateEvent, { DeferredError, TimeoutError } from '../../integrations/integromat';

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

    undecorateInlineReminder($(this), sentAt, 'check');
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

    undecorateInlineReminder($(this), 'Error', 'frown-o');
  }
  finally {
    Knack.hideSpinner();
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

function decorateInlineReminder(td, event) {
  td.addClass('cell-edit knife-inline-reminder');
  td.find('span').html(
    '<i class="fa fa-send-o fa-2x"></i>'
  );
  td.click(event.data, event.handler);
}

function undecorateInlineReminder(td, message, icon) {
  td.off('click');
  td.removeClass('cell-edit');
  td.find('span').html(
    `${message}&nbsp;<i class="fa fa-${icon}"></i>`
  );
  td.prevAll('.cell-edit .knife-inline-reminder').each(function() {
    td.off('click');
    td.removeClass('cell-edit');
    td.find('span').html(
      '&nbsp;'
    );
  });
}

export default function setupInlineRemindersFactory(view, isRevision) {
  const
    inlineReminderFields = Array.from(
      inlineReminderFieldGenerator(view.fields)
    ).reverse();

  return (record) => {
    const
      tr = $(`#${view.key} tr#${record.id}`),
      orderNum = record.field_2_raw;

    for (const [key, options] of inlineReminderFields) {
      const value = record[`${key}_raw`];
      if (value && typeof value === 'object') {
        // the e.g. 14d reminder has already been sent so don't bother showing 7d link
        break;
      }

      decorateInlineReminder(tr.find(`td.${key}`), {
        handler: onInlineReminderClick,
        data: {
          field: {
            key,
            options
          },
          record: {
            isRevision,
            orderNum
          }
        }
      });
    }
  };
};
