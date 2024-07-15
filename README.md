# develex-task

## Developing

The project uses a private npm package develex-core, so you need to configure npm to use the GitLab registry. You can do this by running the following commands:

```bash
npm config set -- //gitlab.ics.muni.cz/:_authToken=YOUR_AUTH_TOKEN

npm config set @473783:registry=https://gitlab.ics.muni.cz/api/v4/projects/7015/packages/npm/
```

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
