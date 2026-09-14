import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`  CA COPILOT API v1 Server Started`);
  console.log(`  Port: http://0.0.0.0:${env.PORT}`);
  console.log(`  Prefix: ${env.API_PREFIX}`);
  console.log(`  Mode: ${env.REPOSITORY_MODE}`);
  console.log(`  Default Firm: ${env.DEFAULT_FIRM_ID}`);
  console.log(`====================================================`);
});
