// this is needed for playwright to access the .env file
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
import 'dotenv/config';
import dotenv from 'dotenv';
import {fileURLToPath} from 'url';
import {dirname, resolve} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function globalSetup() {
  dotenv.config({
    path: resolve(__dirname, '../backend/.env'),
    override: true
  });
};

export default globalSetup;
