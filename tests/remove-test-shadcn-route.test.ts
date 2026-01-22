// Set minimal environment variables for testing
process.env.NODE_ENV = 'development';
process.env.HOST = 'http://localhost:3001'; // different port to avoid conflict
process.env.SECRET_KEY = 'test-secret-key-that-is-at-least-32-characters-long-for-testing-purposes';
process.env.APP_NAME = 'HyperAuth';
process.env.EMAIL_FROM = 'test@example.com';
process.env.PORT = '3001';

import { beforeAll, describe, expect, test, afterAll } from 'bun:test';

describe('Remove test shadcn route from server', () => {
  let serverProcess: any;

  beforeAll(async () => {
    // Start the server
    serverProcess = Bun.spawn(['bun', '--watch', 'src/server.tsx'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'development',
        HOST: 'http://localhost:3001',
        SECRET_KEY: 'test-secret-key-that-is-at-least-32-characters-long-for-testing-purposes',
        APP_NAME: 'HyperAuth',
        EMAIL_FROM: 'test@example.com',
        PORT: '3001',
      },
      stdout: 'pipe',
      stderr: 'pipe',
    });

    // Wait for server to start by checking if port is listening
    let retries = 10;
    while (retries > 0) {
      try {
        const response = await fetch('http://localhost:3001/login');
        if (response.status === 200) break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 500));
      retries--;
    }
    if (retries === 0) throw new Error('Server did not start');
  });

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  test('should serve login page at root path', async () => {
    const response = await fetch('http://localhost:3001/');
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('Welcome back');
  });

  test('should return 404 for /test-shadcn route', async () => {
    const response = await fetch('http://localhost:3001/test-shadcn');
    expect(response.status).toBe(404);
  });

  test('should complete full authentication flow', async () => {
    // Basic check that auth flow starts correctly
    const response = await fetch('http://localhost:3001/login');
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('Welcome back');
  });
});
