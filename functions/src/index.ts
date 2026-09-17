import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export { reminderJob, unsubscribe } from './reminders';
export { submitFeedback } from './feedback';
export { deleteAccount } from './account';
export { askDoubt } from './doubts';
