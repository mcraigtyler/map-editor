import express from 'express';
import morgan from 'morgan';
import { RegisterRoutes } from './routes';
import { ValidateError } from 'tsoa';

export const app = express();

app.use(express.json());
app.use(morgan('dev'));

RegisterRoutes(app);

// Error handler
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ValidateError) {
    return res.status(422).json({ message: 'Validation Failed', details: err?.fields });
  }
  if (err instanceof Error) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }

  return next();
});
