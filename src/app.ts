import {
  ContextMode,
  PuppeteerPool,
  RunTaskResponse,
} from '@hoplin/puppeteer-pool';
import express, { Application, NextFunction, Request, Response } from 'express';
import { loggerMiddleware } from './internal/logger';
import { startServer } from './internal/process';
import router from './routes';
const cors = require('cors');

async function bootstrap() {
  const poolInstance = await PuppeteerPool.start(3, ContextMode.ISOLATED, {
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--disable-translate',
    ],
  });

  const server: Application = express();

  // Base Middleware
  // CORS default allow origin all ('*')
  server.use(
    cors(),
    express.json(),
    express.urlencoded({ extended: true }),
    loggerMiddleware,
  );

  server.post('/', async (req, res) => {
    const url = req.body.url;
    const taskResponse: RunTaskResponse<any> = await poolInstance.runTask(
      async (session) => {
        await session.goto(url, {
          waitUntil: 'networkidle0',
        });

        const body = await session.evaluate(() => {
          return document.body.innerText.replace(/[\n\t\r]+/g, ' ').trim();
        });
        const title = await session.evaluate(() => {
          const title = document.title;
          return title;
        });
        const ogImage = await session.evaluate(() => {
          const ogImageMeta = document.querySelector(
            'meta[property="og:image"]',
          );
          return ogImageMeta ? ogImageMeta['content'] : null;
        });
        return {
          body,
          title,
          ogImage,
        };
      },
    );
    if (taskResponse.success) {
      return res.status(200).json({ result: taskResponse.data });
    }
    if (taskResponse.success === false) {
      return res.status(500).json({ error: String(taskResponse.error) });
    }
  });

  server.use(router);

  server.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    return res.status(500).json({ error: err.message });
  });

  startServer(server);
}

bootstrap();
