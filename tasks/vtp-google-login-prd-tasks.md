## Relevant Files

- `webpack.common.js` - To add a new entry for `vtp.jsx`.
- `client/src/vtp.jsx` - The main React component for the Virtual Team Parent app.
- `client/src/media/vtp.css` - To be created for styling the VTP component.
- `server/vtp.router.js` - To add new routes for authentication.
- `server/vtp.api.js` - To implement the OAuth logic.
- `server/vtp.schema.js` - To update the user schema.
- `server/config.js` - To retrieve Google API credentials.

## Tasks

- [x] 1.0 Setup Webpack and Create `vtp.jsx`
  - [x] 1.1 Add a new entry for `vtp.jsx` in `webpack.common.js`.
  - [x] 1.2 Add a new `HtmlWebpackPlugin` for `vtp.html` in `webpack.common.js`.
  - [x] 1.3 Create the initial `vtp.jsx` component with `login` and `dashboard` views.
- [x] 2.0 Implement the Login View
  - [x] 2.1 Add the `VirtualTeamLogo.png` to the login view.
  - [x] 2.2 Add the "Login with Google" button.
  - [x] 2.3 Create a new CSS file `vtp.css` for styling, using `index.css` for design inspiration.
  - [x] 2.4 Import and apply styles from `vtp.css` to the `vtp.jsx` component.
- [x] 3.0 Implement Google OAuth 2.0 Authentication
  - [x] 3.1 Handle Initial Login Request (Server-Side)
    - [x] 3.1.1 Create a `GET /vtp/auth/google` route in `vtp.router.js`.
    - [x] 3.1.2 In `vtp.api.js`, create a function to be called by the route.
    - [x] 3.1.3 Inside this function, construct the Google OAuth URL with the correct parameters (client_id, scope, redirect_uri, response_type).
    - [x] 3.1.4 Redirect the user's browser to the constructed Google OAuth URL.
  - [x] 3.2 Handle Google's Callback (Server-Side)
    - [x] 3.2.1 Create a `GET /vtp/auth/google/callback` route in `vtp.router.js`.
    - [x] 3.2.2 In `vtp.api.js`, create a function to handle the callback.
    - [x] 3.2.3 Extract the `authorization code` from the URL query parameters.
    - [x] 3.2.4 Make a `POST` request to Google's token endpoint to exchange the code for tokens.
    - [x] 3.2.5 Receive the `access_token` and `refresh_token` from Google.
    - [x] 3.2.6 Redirect the user to the VTP dashboard upon successful token exchange.
  - [x] 3.3 Implement Error Handling (Server-Side)
    - [x] 3.3.1 In the callback handler, check for an `error` query parameter from Google (if the user denies access).
    - [x] 3.3.2 If an error is present, redirect the user to the login page with an error message.
    - [x] 3.3.3 Add error handling for the server-to-server token exchange request.
- [x] 4.0 Handle User Data
  - [x] 4.1 Use the `POST /vtp/data/vtpuser` route to save user data on successful login.
- [x] 5.0 Implement the Dashboard View
  - [x] 5.1 Create the basic structure of the dashboard view.
  - [x] 5.2 Add placeholder elements for future functionality.
