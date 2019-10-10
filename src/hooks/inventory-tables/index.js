import setupInlineRemindersFactory from '../../helpers/inline-reminders';

export function renderInventoryTableViewFactory({ isRevision }) {
  return function(event, view, records) {
    const setupInlineReminders = setupInlineRemindersFactory(view, isRevision);

    records.forEach((record) => {
      setupInlineReminders(record);
    });
  };
};
