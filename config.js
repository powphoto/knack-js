import { renderInventoryTableViewFactory } from './src/hooks/inventory-tables';

export default {
  knack: {
    baseUrl: 'https://api.knack.com/v1',
    hooks: {
      'knack-view-render': {
        view_50: renderInventoryTableViewFactory({ isRevision: false }),
        view_140: renderInventoryTableViewFactory({ isRevision: true }),
        view_91: renderInventoryTableViewFactory()
      }
    }
  },
  integrations: {
    integromat: {
      baseUrl: 'https://hook.integromat.com',
      events: {
        routerHook: null,
        timeout: 30_000 // ms
      }
    }
  }
};
