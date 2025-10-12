# App Flow Document

# App Flow Document

## Onboarding and Sign-In/Sign-Up

When a new user visits the application for the first time, they land on a welcoming home page that highlights the key benefits of tracking multiple assets in one place. This landing page offers clear buttons for signing up or signing in. If the user chooses to sign up, they are taken to a registration form where they provide their email address, choose a password, and confirm their acceptance of the terms of service. After submitting the form, they receive a confirmation email and a link to verify their account. Once they click the verification link, they are automatically signed in and redirected to the dashboard.

If the user already has an account, they click the sign-in button and enter their email and password on a secure sign-in page. A link to recover a forgotten password is available on the sign-in page. When clicked, the user is prompted to enter their email address and receives a password reset link by email. Clicking that link opens a page where they set a new password and are then redirected to the sign-in page to log in with their updated credentials. At the top of each page after logging in, there is a profile icon that allows the user to sign out at any time. Signing out returns the user to the landing page.

## Main Dashboard or Home Page

Upon successful sign-in, the user is brought directly to the main dashboard. A vertical sidebar on the left displays navigation options including Overview, Transactions, Assets, and Settings. The top of the page features a header bar with the application logo on the left, a dark mode toggle in the center, and a user profile menu on the right that provides access to account settings and the sign-out action.

The central panel of the dashboard shows an overall portfolio value summary at the top, accompanied by daily and weekly change percentages. Below this, interactive cards display quick statistics for each asset category such as precious metals, stocks, funds, and cryptocurrencies. A data table lists individual assets with columns for asset name, total quantity, average cost, current value, and profit or loss. A button labeled “Add New Transaction” is prominently placed above the table to initiate entry of new buy or sell actions. At the bottom of the dashboard, a chart area renders performance graphs over time, showing monthly or yearly trends.

## Detailed Feature Flows and Page Transitions

When a user selects the “Add New Transaction” button on the dashboard, a modal form appears. This form prompts the user to choose an asset from a dropdown list or to create a new asset entry by specifying its name and type (for example, gold, silver, stock, fund, or crypto). The user then enters the transaction details: type of action (buy or sell), quantity, price per unit, and date of transaction. Submitting the form triggers an API call to the backend where the transaction is validated and stored. On success, the modal closes, the asset list and portfolio summary automatically update, and success feedback appears briefly at the top of the dashboard.

Clicking on an asset row in the dashboard table navigates the user to the detailed asset page. This page shows the same header and sidebar for consistent navigation. The main section summarizes the selected asset’s total quantity, average cost, current market value, and profit or loss. Below this summary, a transaction table displays each individual buy or sell record, including date, quantity, price, and resulting lot details for assets that require item-by-item tracking. Each table row has edit and delete icons. When the user clicks edit, the same transaction form appears with fields pre-populated. After making changes and saving, the updated data is reflected immediately. When the user deletes a transaction, a confirmation dialog appears and, upon confirmation, the record is removed and the portfolio totals recalculate.

For retrieving live market prices, the application uses server-side API routes. When the dashboard or asset page loads, it requests the latest price for each asset via a secure endpoint. These background calls fetch data from external services such as stock exchanges, fund price feeds, and commodity price APIs. The response is cached briefly to avoid overloading third-party services. If a premium user has enabled email or push notifications, the system’s scheduled job calculates daily performance changes and sends alerts when thresholds are met.

Administrators and premium users can access an extended section by clicking “Admin Panel” or “Subscription” in the sidebar. In the admin panel, user roles can be managed, and data feeds configured. In the subscription section, users can choose a plan, enter payment information, and view billing history. Payment data is processed through a secure payment gateway and subscription status is stored in the user profile.

## Settings and Account Management

The Settings page is reachable from the sidebar or the profile menu. It opens a form where the user can update personal information such as name and email. Below this section, password management fields allow the user to change their password after providing the current one. A separate section offers notification preferences, including toggles for daily email summaries or in-app alerts. Theme settings let the user switch between light and dark modes, with changes applied instantly across the entire app. If the user has an active subscription, a billing subsection displays current plan details, upcoming charges, and options to upgrade or cancel. Saving any changes on this page shows a confirmation message and returns the user to the dashboard if they click “Return to Dashboard.”

## Error States and Alternate Paths

Whenever a user submits invalid data—for example, omitting the quantity or entering a negative price—the form highlights the specific fields in red and shows an inline error message describing the mistake. If an API call to store a transaction fails, a banner appears at the top of the screen explaining that there was an error saving the data and inviting the user to retry. If the app loses network connectivity, a notification bar appears informing the user of the offline status and disabling buttons that require server access. Once connectivity returns, the bar disappears, and pending requests automatically retry.

If a user tries to access a protected page without being signed in, the app redirects them back to the sign-in page. If the authentication token expires while the user is active, any attempt to fetch protected data causes an automatic sign-out, and the login screen displays a message indicating that the session has timed out.

## Conclusion and Overall App Journey

In a typical user journey, a visitor arrives at the landing page, signs up with email and password, and verifies their account. They sign in and land on the dashboard, where they see an overview of their portfolio. They add buy and sell transactions, view detailed lot-level history for each asset, and watch their performance charts update in real time. They manage their profile and notification settings, and if they choose a premium plan, they configure billing and receive automated alerts on market movements. Any errors, such as invalid input or network issues, are handled gracefully with clear messages, and the user can always sign out when finished. This flow delivers a seamless experience from the moment a user discovers the app to the daily management of their multi-asset portfolio.

---
**Document Details**
- **Project ID**: 9996f6d0-22b9-4cb2-a2e4-6f42e720cff0
- **Document ID**: 79c855f6-65e8-410a-a317-bb89d57756e6
- **Type**: custom
- **Custom Type**: app_flow_document
- **Status**: completed
- **Generated On**: 2025-10-12T15:23:32.038Z
- **Last Updated**: N/A
