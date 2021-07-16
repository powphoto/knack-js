import $ from 'jquery';

import generateEvent, { DeferredError } from '../../integrations/integromat';
import { mapField } from '../../knack';
import { TimeoutError } from '../../utils/fetch-with-timeout';

async function makeSplits(event) {
  try {
    Knack.showSpinner();

    await generateEvent('SPLIT_ORDER_QUANTITY', event.data.orderNum);

    window.location.reload(true);
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

      console.error(err);
    }
  }
  finally {
    Knack.hideSpinner();
  }
}

export function renderSplitQuantityForm(event, view, data) {
  const r = $('<input/>', {
    type: 'button',
    class: 'kn-button',
    value: 'Update Splits'
  });

  $(`#${view.key} > section > div > div > div > div > div`).append(r);

  r.on('click', {
    orderNum: data[mapField('order.number').ref]
  }, makeSplits);
};
