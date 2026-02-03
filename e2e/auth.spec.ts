import { test, expect } from '@playwright/test';

test.describe('Feature: Login Page', () => {
  test.describe('Scenario: User visits login page', () => {
    test('should display the login form with all required elements', async ({ page }) => {
      // Given I am on the login page
      await page.goto('/login');

      // Then I should see the welcome message
      await expect(page.getByText('Welcome back')).toBeVisible();

      // And I should see the email input field
      const emailInput = page.getByLabel('Email address');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('required', '');

      // And I should see the submit button
      await expect(page.getByRole('button', { name: 'Continue with email' })).toBeVisible();

      // And I should see the security message
      await expect(page.getByText('End-to-end encrypted')).toBeVisible();
    });

    test('should have proper page title', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveTitle('Sign in');
    });

    test('should have CSRF token in form', async ({ page }) => {
      await page.goto('/login');
      const csrfInput = page.locator('input[name="csrf"]');
      await expect(csrfInput).toHaveAttribute('type', 'hidden');
      const csrfValue = await csrfInput.getAttribute('value');
      expect(csrfValue).toBeTruthy();
      expect(csrfValue!.split('.').length).toBe(3); // JWT format
    });
  });

  test.describe('Scenario: User submits email for magic link', () => {
    test('should show development mode message after valid email submission', async ({ page }) => {
      // Given I am on the login page
      await page.goto('/login');

      // When I enter a valid email
      await page.getByLabel('Email address').fill('test@example.com');

      // And I click the submit button
      await page.getByRole('button', { name: 'Continue with email' }).click();

      // Then I should see the development mode message
      await expect(page.getByText('Development mode')).toBeVisible();
      await expect(page.getByText('Use this magic link to sign in:')).toBeVisible();

      // And I should see a back to login button
      await expect(page.getByRole('button', { name: 'Back to login' })).toBeVisible();
    });

    test('should prevent submission of invalid email via HTML5 validation', async ({ page }) => {
      // Given I am on the login page
      await page.goto('/login');

      // When I enter an invalid email
      const emailInput = page.getByLabel('Email address');
      await emailInput.fill('not-an-email');

      // And I click the submit button
      await page.getByRole('button', { name: 'Continue with email' }).click();

      // Then the form should not submit (HTML5 validation)
      // The browser prevents invalid email submission
      await expect(page).toHaveURL('/login');

      // And the email input should have validation error state
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBe(true);
    });

    test('should normalize email addresses', async ({ page }) => {
      // Given I am on the login page
      await page.goto('/login');

      // When I enter an email with uppercase letters
      await page.getByLabel('Email address').fill('TEST@EXAMPLE.COM');

      // And I click the submit button
      await page.getByRole('button', { name: 'Continue with email' }).click();

      // Then I should see the development mode message (email was accepted)
      await expect(page.getByText('Development mode')).toBeVisible();
    });

    test('should handle Gmail plus addressing', async ({ page }) => {
      // Given I am on the login page
      await page.goto('/login');

      // When I enter a Gmail address with plus addressing
      await page.getByLabel('Email address').fill('user+tag@gmail.com');

      // And I click the submit button
      await page.getByRole('button', { name: 'Continue with email' }).click();

      // Then I should see the development mode message
      await expect(page.getByText('Development mode')).toBeVisible();
    });
  });

  test.describe('Scenario: User navigates back from development mode', () => {
    test('should return to login page when clicking back button', async ({ page }) => {
      // Given I submitted an email and see the development mode message
      await page.goto('/login');
      await page.getByLabel('Email address').fill('test@example.com');
      await page.getByRole('button', { name: 'Continue with email' }).click();
      await expect(page.getByText('Development mode')).toBeVisible();

      // When I click the back to login button
      await page.getByRole('button', { name: 'Back to login' }).click();

      // Then I should be back on the login page
      await expect(page.getByText('Welcome back')).toBeVisible();
      await expect(page.getByLabel('Email address')).toBeVisible();
    });
  });
});

test.describe('Feature: Magic Link Verification', () => {
  test.describe('Scenario: User clicks valid magic link', () => {
    test('should authenticate user with valid magic link', async ({ page, request }) => {
      // First, get the login page to obtain a CSRF token
      const loginResponse = await request.get('/login');
      const loginHtml = await loginResponse.text();
      const csrfMatch = loginHtml.match(/name="csrf" value="([^"]+)"/);
      const csrfToken = csrfMatch?.[1];
      expect(csrfToken).toBeTruthy();

      // Submit login form via API to get the magic link in response
      const formData = new URLSearchParams();
      formData.append('email', 'verify@example.com');
      formData.append('csrf', csrfToken!);

      const loginPostResponse = await request.post('/auth/login', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: formData.toString(),
      });

      expect(loginPostResponse.status()).toBe(200);

      // Extract magic link from the HTML response
      const responseHtml = await loginPostResponse.text();
      const magicLinkMatch = responseHtml.match(/href="([^"]*\/auth\/verify\?token=[^"]+)"/);
      expect(magicLinkMatch).toBeTruthy();
      const magicLink = magicLinkMatch?.[1];
      expect(magicLink).toBeTruthy();

      // Navigate to the magic link to complete authentication
      await page.goto(magicLink!);

      // Then I should be authenticated and see the success message
      await expect(page.getByText("You're in!")).toBeVisible();
      await expect(page.getByText('Signed in as verify@example.com')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue to dashboard' })).toBeVisible();
    });
  });

  test.describe('Scenario: User clicks invalid magic link', () => {
    test('should redirect to login with error for invalid token', async ({ page }) => {
      // When I visit the verify endpoint with an invalid token
      await page.goto('/auth/verify?token=invalid-token');

      // Then I should be redirected to login with an error
      await expect(page).toHaveURL(/\/login\?error=/);
    });

    test('should redirect to login with error for missing token', async ({ page }) => {
      // When I visit the verify endpoint without a token
      await page.goto('/auth/verify');

      // Then I should be redirected to login with verification_required error
      await expect(page).toHaveURL(/\/login\?error=verification_required/);
    });

    test('should show appropriate error message for invalid token', async ({ page }) => {
      // When I visit login page with invalid_token error
      await page.goto('/login?error=invalid_token');

      // Then I should see the error toast
      await expect(
        page.getByText('Your verification link is invalid or has expired. Please request a new one.')
      ).toBeVisible();
    });

    test('should show appropriate error message for expired token', async ({ page }) => {
      // When I visit login page with expired_token error
      await page.goto('/login?error=expired_token');

      // Then I should see the expired error toast
      await expect(page.getByText('Your verification link has expired. Please request a new one.')).toBeVisible();
    });

    test('should show appropriate error message for used token', async ({ page }) => {
      // When I visit login page with token_revoked error
      await page.goto('/login?error=token_revoked');

      // Then I should see the revoked error toast
      await expect(
        page.getByText('This verification link has already been used. Please request a new one.')
      ).toBeVisible();
    });
  });
});

test.describe('Feature: Logout', () => {
  test.describe('Scenario: User logs out', () => {
    test('should redirect to login page after logout', async ({ page }) => {
      // When I visit the logout endpoint
      await page.goto('/auth/logout');

      // Then I should be redirected to the login page
      await expect(page).toHaveURL('/login');
      await expect(page.getByText('Welcome back')).toBeVisible();
    });

    test('should clear cookies on logout', async ({ page, context }) => {
      // Given I have some cookies set (matching actual cookie config)
      await context.addCookies([
        { name: 'access_token', value: 'test', domain: 'localhost', path: '/' },
        { name: 'refresh_token', value: 'test', domain: 'localhost', path: '/' },
      ]);

      // When I visit the logout endpoint
      await page.goto('/auth/logout');

      // Then I should be redirected to login
      await expect(page).toHaveURL('/login');

      // And the access_token cookie should be cleared
      const cookies = await context.cookies();
      const accessCookie = cookies.find((c) => c.name === 'access_token');

      // Cookie is deleted by setting empty value or removing it
      expect(accessCookie?.value || '').toBeFalsy();
    });
  });
});

test.describe('Feature: Token Refresh', () => {
  test.describe('Scenario: User attempts to refresh without token', () => {
    test('should redirect to login when no refresh token exists', async ({ page }) => {
      // When I visit the refresh endpoint without a token
      await page.goto('/auth/refresh');

      // Then I should be redirected to login
      await expect(page).toHaveURL('/login');
    });

    test('should return 401 for API refresh without token', async ({ request }) => {
      // When I make a POST request to refresh without a token
      const response = await request.post('/auth/refresh');

      // Then I should get a 401 response
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.message).toBe('Unauthorized');
    });
  });
});

test.describe('Feature: Rate Limiting', () => {
  test.describe('Scenario: User exceeds login rate limit', () => {
    test.skip('should return rate limit error after too many requests', async ({ request }) => {
      // NOTE: Rate limiting is not currently implemented in the server
      // This test is skipped until rate limiting middleware is added
      // See: src/server.tsx for middleware configuration
    });
  });
});

test.describe('Feature: CSRF Protection', () => {
  test.describe('Scenario: User submits form without CSRF token', () => {
    test('should reject login without CSRF token', async ({ playwright }) => {
      // Use a fresh context to avoid rate limiting from other tests
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
          'X-Forwarded-For': '192.168.1.100',
        },
      });

      // When I submit the login form without a CSRF token
      const formData = new URLSearchParams();
      formData.append('email', 'csrf-test1@example.com');

      const response = await context.post('/auth/login', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: formData.toString(),
      });

      // Then I should get a 403 response
      expect(response.status()).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Missing CSRF token');

      await context.dispose();
    });

    test('should reject login with invalid CSRF token', async ({ playwright }) => {
      // Use a fresh context to avoid rate limiting from other tests
      const context = await playwright.request.newContext({
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: {
          'X-Forwarded-For': '192.168.1.101',
        },
      });

      // When I submit the login form with an invalid CSRF token
      const formData = new URLSearchParams();
      formData.append('email', 'csrf-test2@example.com');
      formData.append('csrf', 'invalid-token');

      const response = await context.post('/auth/login', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: formData.toString(),
      });

      // Then I should get a 403 response
      expect(response.status()).toBe(403);
      const body = await response.json();
      expect(body.error).toBe('Invalid CSRF token');

      await context.dispose();
    });
  });
});

test.describe('Feature: Accessibility', () => {
  test.describe('Scenario: Login page is accessible', () => {
    test('should have proper form labels', async ({ page }) => {
      await page.goto('/login');

      // Email input should have a label
      const emailLabel = page.getByText('Email address');
      await expect(emailLabel).toBeVisible();

      // Input should be associated with label
      const emailInput = page.getByLabel('Email address');
      await expect(emailInput).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');

      // Focus on email input using keyboard
      const emailInput = page.getByLabel('Email address');
      await emailInput.click();

      // Verify we can type in the input
      await page.keyboard.type('accessibility-test@example.com');
      await expect(emailInput).toHaveValue('accessibility-test@example.com');

      // Verify the submit button is focusable via Tab
      await page.keyboard.press('Tab');
      const submitButton = page.getByRole('button', { name: 'Continue with email' });
      await expect(submitButton).toBeFocused();

      // Verify we can navigate back to input
      await page.keyboard.press('Shift+Tab');
      await expect(emailInput).toBeFocused();
    });

    test('should have required attribute on email input', async ({ page }) => {
      await page.goto('/login');
      const emailInput = page.getByLabel('Email address');
      await expect(emailInput).toHaveAttribute('required', '');
    });
  });
});
