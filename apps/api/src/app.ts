import express from 'express';
import swaggerUi from 'swagger-ui-express';
import * as openApiDocument from './spec/openapi.json';
import cors from 'cors';
import morgan from 'morgan';
import { RegisterRoutes } from './routes';
import { ValidateError } from 'tsoa';
import { DomainError } from './utils/errors';

export const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Serve OpenAPI spec
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use(express.json());
app.use(morgan('dev'));

RegisterRoutes(app);

// Error handler
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ValidateError) {
    return res.status(422).json({ message: 'Validation Failed', details: err?.fields });
  }
  if (err instanceof DomainError) {
    console.error(err);
    return res.status(err.status).json({ message: err.message, details: err.details });
  }
  if (err instanceof Error) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }

  return next();
});
