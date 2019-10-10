import { renderInventoryTableViewFactory } from './src/hooks/inventory-tables';

export default {
  knack: {
    baseUrl: 'https://api.knack.com/v1',
    hooks: {
      'knack-view-render': {
        view_50: renderInventoryTableViewFactory({ isRevision: false }),
        view_140: renderInventoryTableViewFactory({ isRevision: true })
      }
    }
  },
  integrations: {
    integromat: {
      baseUrl: 'https://hook.integromat.com',
      event: {
        routerHook: null,
        timeout: 30_000 // ms
      }
    }
  }
};
