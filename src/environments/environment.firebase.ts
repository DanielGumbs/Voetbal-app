import { firebaseConfig } from '../../firebase.config';

// Explicit legacy build, retained for a controlled rollback during migration.
export const environment = {
  production: true,
  firebase: firebaseConfig,
};
