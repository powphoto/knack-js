import { renderInventoryTableViewFactory } from './src/hooks/inventory-tables';
import { renderSplitQuantityForm } from './src/hooks/split-quantities';

export default {
  knack: {
    baseUrl: 'https://api.knack.com/v1',
    hooks: {
      'knack-view-render': {
        view_50: renderInventoryTableViewFactory({ isRevision: false }),
        view_140: renderInventoryTableViewFactory({ isRevision: true }),
        view_91: renderInventoryTableViewFactory(),
        view_198: renderSplitQuantityForm
      }
    }
  },
  integrations: {
    integromat: {
      baseUrl: 'https://hook.integromat.com',
      eventDefaults: {
        // put defaults for all events here
      },
      events: {
        // N.B. These may be further defined in the Knack app settings.
        '30DAY_UPDATE': {
          path: undefined
        },
        INLINE_REMINDER: {
          path: undefined
        },
        SPLIT_ORDER_QUANTITY: {
          path: undefined
        }
      }
    }
  }
};
