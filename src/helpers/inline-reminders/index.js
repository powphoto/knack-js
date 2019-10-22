/* global Knack */
import $ from 'jquery';

import generateEvent, { DeferredError } from '../../integrations/integromat';
import { TimeoutError } from '../../utils/fetch-with-timeout';
import { formatDateTime, getField, isDateTime } from '../../knack';

async function onInlineReminderClick(event) {
  // if the text is hyperlinked this will prevent the browser from updating the url
  event.preventDefault();
  // prevent the inline editor modal attached to the cell-edit class from popping up
  event.stopImmediatePropagation();

  const {
    eventType,
    orderNum,
    custom,
    rawFormat
  } = event.data;

  try {
    Knack.showSpinner();

    const
      response = await generateEvent(eventType, orderNum, custom),
      sentAt = formatDateTime(response.custom.sentAt, rawFormat);

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

    const reminder = /(\d+)[\s-]*[Dd](?:ay)?\s+(?:[Rr]emind(?:er)?\s+)?[Ee](?:mail|\.)\s+[Ss]ent/.exec(field.name);
    if (!reminder) {
      continue;
    }

    const hold = /^[Ii]nv(?:entory)?:?\s+(\d+)[\s-]*[Dd](?:ay)?/.exec(field.name);

    yield [
      field.key,
      {
        holdDays: hold && parseInt(hold[1], 10),
        reminderDays: parseInt(reminder[1], 10),
        rawFormat: field.format
      }
    ];
  }

  return;
}

function decorateInlineReminder(td, eventHandler, eventData) {
  td.addClass('cell-edit knife-inline-reminder');
  td.find('span').html(
    '<i class="fa fa-send-o fa-2x"></i>'
  );
  td.click(eventData, eventHandler);
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
      getter = _ => record[getField(_).ref],
      orderNum = getter('order.number');

    for (const [key, options] of inlineReminderFields) {
      if (!(key in record)) {
        continue;
      }

      const value = record[`${key}_raw`];
      if (isDateTime(value)) {
        // the e.g. 14d reminder has already been sent so don't bother showing 7d link
        break;
      }

      const { holdDays, reminderDays, rawFormat } = options;

      const
        eventType = holdDays ? '30DAY_UPDATE' : 'INLINE_REMINDER',
        custom = (function() {
          switch (eventType) {
            case '30DAY_UPDATE': return {
              isInitialConfirmation: false,
              get isExactTurnaround() {
                return !getter('order.hasMultipleDueDates');
              },
              get startAt() {
                const value = getter('order.hold30d.startAt');
                if (isDateTime(value)) {
                  return value.iso_timestamp;
                }
              },
              get endAt() {
                const value = getter('order.hold30d.endAt');
                if (isDateTime(value)) {
                  return value.iso_timestamp;
                }
              }
            };

            case 'INLINE_REMINDER': return {
              template: `day-${reminderDays}-reminder`,
              isRevision
            };
          }
        })();

      decorateInlineReminder(tr.find(`td.${key}`), onInlineReminderClick, {
        custom,
        eventType,
        orderNum,
        rawFormat
      });
    }
  };
};
