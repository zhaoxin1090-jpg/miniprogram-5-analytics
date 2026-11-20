import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const testing = mode === 'analytics-test';
  if (testing && loadEnv(mode, process.cwd()).VITE_TCB_ENV_ID !== 'todo-demo-d8gpkd5td28377e35') {
    throw new Error('Analytics test builds must target todo-demo-d8gpkd5td28377e35.');
  }
  return {
    base: './',
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    build: {
      sourcemap: false,
      ...(testing ? { outDir: 'dist-analytics-test' } : {}),
    },
  };
});
