import { app } from './app';
import { config } from './config';
import { AppDataSource } from './data/datasource';

async function start() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');
    await AppDataSource.runMigrations();
    console.log('Database migrations applied');
    app.listen(config.port, () => {
      console.log(`API server running on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
