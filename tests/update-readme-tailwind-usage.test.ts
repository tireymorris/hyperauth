import { describe, expect, test } from 'bun:test';

describe('Update README to reflect Tailwind CSS usage', () => {
  test('README.md should mention Tailwind CSS in Tech Stack', async () => {
    const readmeContent = await Bun.file('README.md').text();
    expect(readmeContent).toContain('Tailwind CSS');
    expect(readmeContent).not.toContain('UnoCSS');
  });

  test('package.json should contain tailwindcss dependency', async () => {
    const packageJson = await Bun.file('package.json').json();
    expect(packageJson.devDependencies).toHaveProperty('tailwindcss');
  });

  test('build:css script should reference tailwindcss', async () => {
    const packageJson = await Bun.file('package.json').json();
    expect(packageJson.scripts['build:css']).toContain('tailwindcss');
  });

  test('bun run build:css should execute successfully', async () => {
    const proc = Bun.spawn(['bun', 'run', 'build:css'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });
});
