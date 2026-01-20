import { test, expect } from '@playwright/test';

test.describe('Feature: Button Component Replacement', () => {
  test.describe('Scenario: Custom Button component replaced with shadcn Button', () => {
    test('should render primary Button variant with glass-button styling on login page', async ({ page }) => {
      await page.goto('/login');

      const submitButton = page.getByRole('button', { name: 'Continue with email' });
      await expect(submitButton).toBeVisible();

      // Assert it has glass-button class for visual styling
      await expect(submitButton).toHaveClass(/glass-button/);

      // Assert computed background has gradient (glass-button styling)
      const bgImage = await submitButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage;
      });
      expect(bgImage).toContain('linear-gradient');
    });

    test('should render secondary Button variant with glass-button-secondary styling on not found page', async ({
      page,
    }) => {
      await page.goto('/nonexistent');

      const goHomeButton = page.getByRole('button', { name: 'Go back home' });
      await expect(goHomeButton).toBeVisible();

      // Assert secondary variant has glass-button-secondary class
      await expect(goHomeButton).toHaveClass(/glass-button-secondary/);

      // Assert background is transparent (secondary styling)
      const bgColor = await goHomeButton.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      expect(bgColor).toBe('rgba(255, 255, 255, 0.03)');
    });

    test('should handle onclick and HTMX attributes correctly', async ({ page }) => {
      // Go to login page
      await page.goto('/login');

      // Submit valid email to trigger development mode page
      await page.getByLabel('Email address').fill('test@example.com');
      await page.getByRole('button', { name: 'Continue with email' }).click();

      // Should be on development mode page
      const backButton = page.getByRole('button', { name: 'Back to login' });
      await expect(backButton).toBeVisible();

      // Assert HTMX attributes are present
      await expect(backButton).toHaveAttribute('hx-get', '/login');
      await expect(backButton).toHaveAttribute('hx-target', 'body');
      await expect(backButton).toHaveAttribute('hx-swap', 'outerHTML');

      // Click the button and verify HTMX behavior (page should reload to login)
      await backButton.click();
      await expect(page.getByText('Welcome back')).toBeVisible();
    });

    test('should confirm previous Tailwind migration and shadcn setup still work', async ({ page }) => {
      await page.goto('/login');

      // Confirm glass-card from Tailwind migration
      const glassCard = page.locator('.glass-card');
      await expect(glassCard).toBeVisible();

      // Confirm shadcn setup via test route
      await page.goto('/test-shadcn');
      await expect(page.getByText('shadcn/ui Button Test')).toBeVisible();
      const shadcnButton = page.getByRole('button', { name: 'Default Button' });
      await expect(shadcnButton).toHaveClass(/bg-primary/);
    });
  });
});
