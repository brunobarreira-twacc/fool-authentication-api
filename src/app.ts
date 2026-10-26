import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import openapiSpec from './openapi.json';

export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.get('/openapi.json', (_req, res) => res.status(200).json(openapiSpec));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  app.use(routes);

  app.use(errorHandler);

  return app;
}
