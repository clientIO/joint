import { tsConfig, jsConfig , reactTsConfig} from '@joint/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    ...jsConfig,
    ...tsConfig,
    ...reactTsConfig,
]);
