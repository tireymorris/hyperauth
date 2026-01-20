import { test, expect } from '@playwright/test';

test.describe('Feature: Input Component Replacement', () => {
  test.describe('Scenario: Input component renders with correct styling', () => {
    test('should display email input with glass-input class', async ({ page }) => {
      // Given I am on the login page
      await page.goto('/login');

      // Then the email input should have the glass-input class
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveClass(/glass-input/);
    });

    test('should render input with correct attributes', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('placeholder', 'you@example.com');
      await expect(emailInput).toHaveAttribute('required', '');
    });
  });

  test.describe('Scenario: Input value updates on typing', () => {
    test('should update input value when typing', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.locator('input[name="email"]');
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
    });
  });

  test.describe('Scenario: Input validation', () => {
    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.locator('input[name="email"]');
      await emailInput.fill('invalid-email');
      await emailInput.blur();

      // Check HTML5 validation
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test('should enforce required validation', async ({ page }) => {
      await page.goto('/login');

      const submitButton = page.getByRole('button', { name: 'Continue with email' });
      await submitButton.click();

      // Should stay on page due to required field
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Scenario: Disabled state', () => {
    test('should show disabled styling when disabled', async ({ page }) => {
      // Since no disabled inputs in current UI, we'll test by adding disabled attribute via JS
      await page.goto('/login');

      const emailInput = page.locator('input[name="email"]');
      await emailInput.evaluate((el: HTMLInputElement) => (el.disabled = true));

      // Check cursor style
      const cursorStyle = await emailInput.evaluate((el) => getComputedStyle(el).cursor);
      expect(cursorStyle).toBe('not-allowed');

      // Check opacity
      const opacity = await emailInput.evaluate((el) => getComputedStyle(el).opacity);
      expect(opacity).toBe('0.5');
    });
  });

  test.describe('Scenario: Cumulative component replacements', () => {
    test('should have both Input and Button components working together', async ({ page }) => {
      await page.goto('/login');

      // Check Input has glass-input class
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveClass(/glass-input/);

      // Check Button has glass-button class (from previous replacement)
      const submitButton = page.getByRole('button', { name: 'Continue with email' });
      await expect(submitButton).toHaveClass(/glass-button/);
    });
  });
});
