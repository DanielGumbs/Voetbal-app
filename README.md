# VoetbalApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Deploying to Firebase Hosting

Follow these steps to deploy a new version to Firebase Hosting.

Prerequisites:

- Install Firebase CLI (one time):
  npm install -g firebase-tools
- Log in to Firebase (one time per machine):
  npm run firebase:login
- Make sure your project is selected or set a default project (replace YOUR_PROJECT_ID):
  firebase use YOUR_PROJECT_ID
  or run:
  npm run firebase:use

Build and deploy:

1. Build a production bundle:
   npm run build:prod
2. Deploy to Firebase Hosting:
   npm run deploy

Notes:

- The Firebase Hosting config is in firebase.json and points to dist/voetbal-app/browser which is where Angular outputs the app.
- If you haven’t initialized hosting locally before, you can run firebase init hosting and choose “Configure files for Firebase Hosting”. This repo already includes a working firebase.json.
- If you prefer CI/CD later, you can add GitHub Actions with firebase/cli-action to build and deploy on push to main.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
