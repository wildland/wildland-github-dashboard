### Overview

Displays list of open pull requests and issues assigned to the the signed-in user.

### Setup
Create a `.env` file with the following format:
```
CLIENTID=YOUR_GITHUB_APPLICATION_CLIENT_ID
CLIENTSECRET=YOUR_GITHUB_APPLICATION_CLIENT_SECRET
```
You can obtain these by registering a new application at [https://github.com/settings/developers](https://github.com/settings/developers). 
For `Authorization callback URL` you would use `http://localhost:3000` if you are developing locally.

### Usage
```
npm install
npm start
```

Runs on [http://localhost:3000](http://localhost:3000)

 * Login with github credentials
 * View dashboard at `/account`

### TODO
 * Cleanup css
 * Add comments
 * Cleanup UI
