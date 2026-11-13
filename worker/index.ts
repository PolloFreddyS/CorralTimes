import { createApp } from './app';

const app = createApp({ adminVerifier: null });

export default {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
