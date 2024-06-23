import dotenv from "dotenv";
import { App } from "octokit";
import { createNodeMiddleware } from "@octokit/webhooks";
import fs from "fs";
import http from "http";
import axios from "axios";
import jwt from "jsonwebtoken";

dotenv.config();

const appId = process.env.GITHUB_APP_IDENTIFIER;
const webhookSecret = process.env.WEBHOOK_SECRET;
const privateKeyPath = process.env.PRIVATE_KEY_PATH;
const ciRunnerUrl = process.env.CI_RUNNER_URL;

const privateKey = fs.readFileSync(privateKeyPath, "utf8");

const app = new App({
  appId: appId,
  privateKey: privateKey,
  webhooks: {
    secret: webhookSecret
  },
});

const messageForNewPRs = "Thank you from pipelineci2024 for opening a new PR!";

async function handlePullRequestOpened({ octokit, payload }) {
  console.log(`Received a pull request event for #${payload.pull_request.number}`);
  try {
    await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: messageForNewPRs,
      headers: {
        "x-github-api-version": "2022-11-28",
      },
    });

    //
    // get installation token
    //

    const generateJWT = () => {
      const payload = {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (10 * 60),
        iss: appId
      };

      return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    };

    //
    // Run CI runner
    //

    let ciCheckStatus;
    await axios.post(`${ciRunnerUrl}/run_ci`)
      .then((response) => {
        if (response.status === 202) {
          console.log("Checks returned with 202, failure");
          ciCheckStatus = "failure";
        } else {
          console.log("Checks were successful.");
          ciCheckStatus = "success";
        }
      })
      .catch((error) => {
        console.log("Checks returned with error");
        ciCheckStatus = "failure";
      });

    await octokit.request("POST /repos/{owner}/{repo}/statuses/{sha}", {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      sha: payload.pull_request.head.sha,
      state: ciCheckStatus,
      target_url: 'https://example.com/build/status',
      description: 'Description from app.js',
      context: 'ci-update/status-update',
      headers: {
        "x-github-api-version": "2022-11-28",
      },
    });
  } catch (error) {
    if (error.response) {
      console.error(`Error! Status: ${error.response.status}. Message: ${error.response.data.message}`);
    }
    console.error(error);
  }
};

async function handleCheckSuiteRequested({ octokit, payload }) {
  console.log("Received a check_suite request event");
};

app.webhooks.on("pull_request.opened", handlePullRequestOpened);

app.webhooks.onError((error) => {
  if (error.name === "AggregateError") {
    console.error(`Error processing request: ${error.event}`);
  } else {
    console.error(error);
  }
});

const port = 3000;
const host = "localhost";
const path = "/api/gh_events";
const localWebhookUrl = `http://${host}:${port}${path}`;

const middleware = createNodeMiddleware(app.webhooks, {path});


http.createServer(middleware).listen(port, () => {
  console.log(`Server is listening for events at: ${localWebhookUrl}`);
  console.log('Press Ctrl + C to quit.');
});
