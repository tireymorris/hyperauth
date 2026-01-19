import { test, expect } from '@playwright/test';

test.describe('Feature: Styling System Migration from UnoCSS to Tailwind CSS', () => {
  test.describe('Scenario: Application loads with Tailwind CSS instead of UnoCSS', () => {
    test('should load the main page without styling-related console errors', async ({ page }) => {
      // Listen for console errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Navigate to the main login page
      await page.goto('/login');

      // Assert page loads successfully
      await expect(page.getByText('Welcome back')).toBeVisible();

      // Assert no styling-related console errors
      const stylingErrors = consoleErrors.filter(
        (error) =>
          error.includes('uno.css') ||
          error.includes('tailwind.css') ||
          error.includes('stylesheet') ||
          error.includes('CSS') ||
          error.includes('style')
      );
      expect(stylingErrors).toHaveLength(0);
    });

    test('should load Tailwind CSS instead of UnoCSS', async ({ page }) => {
      await page.goto('/login');

      // Assert Tailwind CSS is loaded
      const tailwindLink = page.locator('link[href="/styles/tailwind.css"]');
      await expect(tailwindLink).toBeAttached();

      // Assert UnoCSS is not loaded
      const unoLink = page.locator('link[href="/styles/uno.css"]');
      await expect(unoLink).not.toBeAttached();
    });

    test('should render glass-card with correct styling', async ({ page }) => {
      await page.goto('/login');

      // Find the glass-card element (main container)
      const glassCard = page.locator('.glass-card');
      await expect(glassCard).toBeVisible();

      // Check computed background color (should have glass effect)
      const bgColor = await glassCard.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      // rgba(255, 255, 255, 0.03) from CSS
      expect(bgColor).toBe('rgba(255, 255, 255, 0.03)');

      // Check backdrop-filter is applied
      const backdropFilter = await glassCard.evaluate((el) => {
        return window.getComputedStyle(el).backdropFilter;
      });
      expect(backdropFilter).toContain('blur(20px)');
    });

    test('should render glass-button with correct styling', async ({ page }) => {
      await page.goto('/login');

      // Find the glass-button (submit button)
      const glassButton = page.getByRole('button', { name: 'Continue with email' });
      await expect(glassButton).toBeVisible();

      // Check background (should be gradient)
      const bgImage = await glassButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage;
      });
      expect(bgImage).toContain('linear-gradient');

      // Check border color
      const borderColor = await glassButton.evaluate((el) => {
        return window.getComputedStyle(el).borderColor;
      });
      expect(borderColor).toBe('rgba(6, 182, 212, 0.3)'); // --accent-cyan with alpha
    });

    test('should render glass-input with correct styling', async ({ page }) => {
      await page.goto('/login');

      // Find the glass-input (email input)
      const glassInput = page.getByLabel('Email address');
      await expect(glassInput).toBeVisible();

      // Check background color
      const bgColor = await glassInput.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(bgColor).toBe('rgba(255, 255, 255, 0.02)');

      // Check border color
      const borderColor = await glassInput.evaluate((el) => {
        return window.getComputedStyle(el).borderColor;
      });
      expect(borderColor).toBe('rgba(255, 255, 255, 0.06)');
    });

    test('should apply Tailwind utilities correctly', async ({ page }) => {
      await page.goto('/login');

      // Check body has Tailwind flex classes
      const body = page.locator('body');
      const display = await body.evaluate((el) => window.getComputedStyle(el).display);
      expect(display).toBe('flex');

      const flexDirection = await body.evaluate((el) => window.getComputedStyle(el).flexDirection);
      expect(flexDirection).toBe('column');

      const justifyContent = await body.evaluate((el) => window.getComputedStyle(el).justifyContent);
      expect(justifyContent).toBe('center');
    });
  });
});
