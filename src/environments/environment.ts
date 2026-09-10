import { FirebaseOptions } from 'firebase/app';

// Never fall back to production when development configuration is missing.
export const environment: { production: boolean; firebase: FirebaseOptions } = {
  production: false,
  firebase: {
    projectId: 'voetbal-app-6fa54-test',
    appId: '1:381274041149:web:0d8856660fca146344b354',
    apiKey: 'AIzaSyBegMAE9wOlJcHilTPRmxvt6QV6cYNVD-A',
    authDomain: 'voetbal-app-6fa54-test.firebaseapp.com',
    storageBucket: 'voetbal-app-6fa54-test.firebasestorage.app',
    messagingSenderId: '381274041149',
  },
};
