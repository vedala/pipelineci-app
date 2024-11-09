# pipelineci-app

GitHub App is a type of integration provide by GitHub that allows us to extend
GitHub's functionality.

This repo contains one such app. The app's public page is located at (pipelineci2024)[https://github.com/apps/pipelineci2024].

Currently, the project is setup to run only locally. Deployment code and instructions will follow soon.


## Running locally

To create your own GitHub App to use the code in this project, use the following steps:
* Create a GitHub App
* Pick a unique name for the app
* Configure the App:
  * Under `Identifying and authorizing users` section
    * Add Callback URL, which will be something like `https://some-random-string.ngrok-free.app/callback-endpoint`
    * Check the "Request user authorization (OAuth) during installation" checkbox
  * Under `Post installation` section
    * Leave the `Setup URL (optional)` empty
    * Check the `Redirect on update` checkbox
  * Under the `Webhook` section
    * Check the `Active` checkbox
    * Add a `smee` url for `Webhook URL`, it will look something line `https://smee.io/SomeRandomString`
    * Create a secret and save it for future use



### Frontend

Use repo `pipelineci-fe`.

Steps:
* Navigate to repo root.
* Setup `.env` file using env.example as template
* issue following command:

```
npm start
```


### Backend

Use repo `pipelineci-backend`. Navigate to repo 

* Setup `.env` file using env.example as template
* Create sqlite tables
  * Run `node createTableOrganizations.js`
  * Repeat for `createTableAuthorizedRepos.js` and `createTableProjects.js`
* Run backend

```
npm start
```


### Ngrok tunnel to receive callback from GitHub app

Run a Ngrok tunnel to receive callbacks from GitHub app. The following command is forwarding to localhost port 4001.

```
ngrok http --url=your-ngrok-string.ngrok-free.app 4001
```


### pipelineci-app

* Setup `.env` file using `env.example` as template
* Run server
  ```
  npm run server
  ```


### pipelineci-runner

* Setup `.env` from `env.example`
* Run server
  ```
  npm run server
  ```

### Create and run smee server

Since this repo's code will be running locally, we will need to provide a way for github
to access the app's endpoints. Similar to `ngrok` above, `smee` webproxy server is another way to forward
requests from GitHub app to locally running service.

```
smee -u https://smee.io/yourRandomString -t http://localhost:3000/api/gh_events
```
