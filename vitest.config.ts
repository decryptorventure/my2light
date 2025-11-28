/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react() as any],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'json-summary'],
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.test.{ts,tsx}',
                '**/*.config.{ts,js}',
                '**/test/**',
                'src/test/**',
            ],
            thresholds: {
                lines: 50,
                functions: 50,
                branches: 45,
                statements: 50,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
