import { test, expect } from '@playwright/test';

test.describe('Feature: shadcn/ui Setup', () => {
  test.describe('Scenario: shadcn/ui components are properly configured and functional', () => {
    test('should load shadcn Button component without errors', async ({ page }) => {
      await page.goto('/test-shadcn');

      // Assert page loads successfully
      await expect(page.getByText('shadcn/ui Button Test')).toBeVisible();

      // Assert shadcn Button renders
      const defaultButton = page.getByRole('button', { name: 'Default Button' });
      await expect(defaultButton).toBeVisible();
    });

    test('should apply correct Tailwind classes to shadcn Button', async ({ page }) => {
      await page.goto('/test-shadcn');

      const defaultButton = page.getByRole('button', { name: 'Default Button' });

      // Check that it has the expected classes
      await expect(defaultButton).toHaveClass(/bg-primary/);
      await expect(defaultButton).toHaveClass(/text-primary-foreground/);

      // Check computed styles (using CSS variables)
      const bgColor = await defaultButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      // Should be hsl(var(--primary)) which resolves to hsl(221.2 83.2% 53.3%)
      expect(bgColor).toBe('rgb(37, 99, 235)'); // approximate

      const color = await defaultButton.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      // text-primary-foreground: hsl(var(--primary-foreground))
      expect(color).toBe('rgb(248, 250, 252)'); // approximate
    });

    test('should render all shadcn Button variants correctly', async ({ page }) => {
      await page.goto('/test-shadcn');

      // Check each variant
      const variants = [
        { name: 'Default Button', class: /bg-primary/ },
        { name: 'Secondary', class: /bg-secondary/ },
        { name: 'Destructive', class: /bg-destructive/ },
        { name: 'Outline', class: /border.*bg-background/ },
        { name: 'Ghost', class: /hover:bg-accent/ },
        { name: 'Link', class: /text-primary.*underline-offset/ },
      ];

      for (const variant of variants) {
        const button = page.getByRole('button', { name: variant.name });
        await expect(button).toBeVisible();
        await expect(button).toHaveClass(variant.class);
      }
    });

    test('should confirm previous Tailwind migration still works', async ({ page }) => {
      // Test on login page for existing functionality
      await page.goto('/login');

      // Assert glass-card still works
      const glassCard = page.locator('.glass-card');
      await expect(glassCard).toBeVisible();

      const bgColor = await glassCard.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(bgColor).toBe('rgba(255, 255, 255, 0.03)');

      // Assert glass-button still works
      const glassButton = page.getByRole('button', { name: 'Continue with email' });
      await expect(glassButton).toBeVisible();

      const buttonBg = await glassButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage;
      });
      expect(buttonBg).toContain('linear-gradient');
    });
  });
});
