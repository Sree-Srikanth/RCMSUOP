import { createApp } from './app.js';

const { app, ctx } = createApp();
const server = app.listen(ctx.config.port, () => {
  console.log(`UoP AMS API listening on http://localhost:${ctx.config.port}`);
  if (!ctx.config.smtp.host) console.log(`SMTP not configured – emails are written to ${ctx.mailer.outboxDir}`);
});

const shutdown = () => {
  server.close(() => {
    ctx.db.close();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
