import "./config.js";
import { App } from "octokit";
import { createNodeMiddleware } from "@octokit/webhooks";
import http from "http";
import axios from "axios";

const port = process.env.PORT;
const appId = process.env.GITHUB_APP_IDENTIFIER;
const webhookSecret = process.env.WEBHOOK_SECRET;
const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
const ciRunnerUrl = process.env.CI_RUNNER_URL;

const healthCheckMiddleware = async (req, res, next) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Backend is alive!");
  }

  next();
}

const app = new App({
  appId,
  privateKey,
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

    const installationAuthObject = await octokit.auth({
      type: 'installation'
    });

    //
    // Run CI runner
    //

    await octokit.request("POST /repos/{owner}/{repo}/statuses/{sha}", {
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      sha: payload.pull_request.head.sha,
      state: "pending",
      target_url: 'https://example.com/build/status',
      description: 'Description from app.js',
      context: 'ci-update/status-update',
      headers: {
        "x-github-api-version": "2022-11-28",
      },
    });

    // let ciCheckStatus;
    // await axios.post(`${ciRunnerUrl}/run_ci`, {
    //     payload: payload,
    //     token: installationAuthObject.token
    //   }, {
    //     headers: {
    //       'Content-Type': 'application/json'
    //     }
    //   })
    //   .then((response) => {
    //     console.log("Request submitted");
    //     ciCheckStatus = "pending";
    //   })
    //   .catch((error) => {
    //     console.log("Checks returned with error");
    //     ciCheckStatus = "failure";
    //   });

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

const path = "/api/gh_events";

const webhooksMiddleware = createNodeMiddleware(app.webhooks, {path});

const combinedMiddleware = (req, res, next) => {
  const stack = [healthCheckMiddleware, webhooksMiddleware];
  let index = 0;

  const runner = async () => {
    if (index < stack.length) {
      const current = stack[index];
      index++;
      await current(req, res, runner);
    } else {
      next();
    }
  };

  runner().catch((err) => {
    console.error(err);
    res.statusCode = 500;
    res.end("Internal Server Error in runner");
  });
};

const server = http.createServer((req, res) => {
  combinedMiddleware(req, res, () => {
    res.statusCode = 404;
    res.end("Not Found");
  });
});

server.listen(port, () => {
  console.log(`Server is listening for events at path "${path}", port ${port}.`);
  console.log('Press Ctrl + C to quit.');
});
