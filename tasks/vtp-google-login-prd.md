# Product Requirements Document: Virtual Team Parent - Google Account Integration

## 1. Introduction/Overview

This document outlines the requirements for a new feature that allows users of the Virtual Team Parent application to connect their Google account. This is the first step in a broader initiative to leverage Google services for team communication and management. The initial implementation will focus solely on authenticating the user and gaining the necessary permissions to act on their behalf for future features.

## 2. Goals

*   To provide a simple and secure way for users (team parents) to connect their Google account to the Virtual Team Parent application.
*   To obtain the necessary OAuth tokens from Google to allow the application to perform actions on the user's behalf in the future, such as:
    *   Managing team emails.
    *   Sending communications.
    *   Managing Google Sheet email lists.
    *   Using Gemini to write content for communications.

## 3. User Stories

*   "As a parent, I want to connect my Google account so that emails from the coach will be communicated out to all other parents, as well as other tools to be built in the future."

## 4. Functional Requirements

1.  The application must display a "Login with Google" or "Connect Google Account" button on the login page.
2.  Clicking the button must open a popup window to initiate the Google OAuth 2.0 authentication flow.
3.  The user must be presented with the standard Google account selection and consent screen within the popup window.
4.  The application must request the necessary scopes to access Google services that will be used for future features (e.g., Gmail, Google Sheets, etc.).
5.  Upon successful authentication and authorization, the popup window should close automatically after processing is complete.
6.  The main page should then display a dashboard view. This dashboard will initially contain placeholders for future functionality.
7.  The application must securely store the user's OAuth tokens for future use.
8.  If the user denies permission or the authentication fails, the popup should close and an appropriate error message should be displayed on the main page.

## 5. Non-Goals (Out of Scope)

*   This feature will **not** include any functionality beyond account connection at this stage. Features like sending emails or managing Google Sheets will be implemented in subsequent phases.
*   Support for any other social login providers (e.g., Facebook, Apple) is not included.
*   User registration through Google is not a primary goal, the focus is on connecting an existing or new user's Google account.
*   Password reset or account recovery is not part of this feature.

## 6. Design Considerations

*   The login page should have a minimal design, with no header, navigation, or footer.
*   All login elements, including the application logo and the login button, should be centered vertically and horizontally on the page.
*   The `VirtualTeamLogo.png` file should be used for the application logo.
*   The login page UI should be inspired by the existing `index.html` file.
*   Styling should be consistent with the `index.css` file, using the established color palette, fonts, and general look and feel.
*   The "Login with Google" button should be prominently displayed. The standard Google button is acceptable, but a custom button matching the application's branding is preferred.

## 7. Technical Considerations

*   The Google API credentials (client ID and client secret) are stored in the `server/config.js` file and should be used for the OAuth 2.0 implementation.
*   The application will need a backend endpoint to handle the OAuth callback from Google. This new route should be added to `vtp.router.js`.
*   The logic for handling the OAuth callback and any other Google API interactions should be implemented in `vtp.api.js`.
*   The application must request the following Google API scopes:
    *   `https://www.googleapis.com/auth/drive`
    *   `https://mail.google.com/`
*   The application should use the existing `vtp.router.js` for handling user data.
*   The user's Google account information, including the OAuth tokens, should be stored using the `vtpUser` schema defined in `vtp.schema.js`.
*   The `POST /vtp/data/vtpuser` route should be used to save the user's Google account information after successful authentication.
*   The user's OAuth tokens must be stored securely.

## 8. Success Metrics

*   Success metrics will be determined at a later time.

## 9. Open Questions

*   How will the application handle token refresh and revocation?
