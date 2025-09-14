import { app } from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`API server running on port ${config.port}`);
});
