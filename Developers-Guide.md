# Pipelineci - Developer's Guide

## Running locally

To run this application locally, following four repos need to run:
* pipelineci-fe
* pipelineci-backend
* pipelineci-app
* pipelineci-runner


### GitHub App
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

### Tunnels

Except for the frontend repo, other three repos receive either callbacks from GitHub or AWS. To enable locally running processes receive callbacks from external sources, we need to use tunnels.

We use three tunneling utilities in this application: `ngrok`, `smee` and `localtunnel`.

We can probably use just `localtunnel` for all three tunnels that we create, but that is a topic for future research.

Tunnels used:
* pipeline-backend: `ngrok`
* pipelineci-app: `smee`
* pipelineci-runner: `localtunnel`

pipelineci-backend and pipeline-app receive callbacks from GitHub. pipelineci-runner receives notification from AWS SNS.


### AWS SNS

This application uses AWS SNS service to pass messages from pipelineci-app and pipelineci-runner. On pull request creation,
pipelineci-app receives a callback with pull request information. pipelineci-runner is designed to download the repo and
run CI checks. pipelineci-app notifies pipelineci-runner using AWS SNS service.

* Topic: topic is a communication channel setup by SNS service
* Subscription: subscribers to an SNS topic receive messages sent to a topic.

Subscribers can be of many types, we have setup HTTP(S) endpoint

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


#### Ngrok tunnel to receive callback from GitHub app

Run a Ngrok tunnel to receive callbacks from GitHub app. The following command is forwarding to localhost port 4001.

```
ngrok http --url=your-ngrok-string.ngrok-free.app 4001
```


### pipelineci-app

* Setup `.env` file using `env.example` as template
* Set `AWS_PROFILE` environment variable.
  ```
  export AWS_PROFILE=your-aws-profile-name
  ```
* Run server
  ```
  npm start
  ```
* In another terminal window, start `smee` tunnel
  ```
  smee -u https://smee.io/SomeRandomString -t http://localhost:3000/api/gh_events
  ```


### pipelineci-runner

* Setup `.env` from `env.example`
* Run server
  ```
  npm start
  ```
* In another terminal window, start `localtunnel` tunnel to forward requests to `runner`
  ```
  lt --port 4002 --subdomain your-lt-subdomain-name
  ```
