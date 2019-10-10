import $ from 'jquery';

export function registerHooks(hooks) {
  Object.entries(hooks).forEach(([eventName, namespaces]) => {
    Object.entries(namespaces).forEach(([namespace, method]) => {
      $(document).on(`${eventName}.${namespace}`, method);
    });
  });
}
