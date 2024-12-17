import "./config.js";
import { App } from "octokit";
import { createNodeMiddleware } from "@octokit/webhooks";
import http from "http";
import axios from "axios";
import { SQSClient, SendMessageCommand, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import getKnexObj from "./knexObj.js";

const port = process.env.PORT;
const appId = process.env.GITHUB_APP_IDENTIFIER;
const webhookSecret = process.env.WEBHOOK_SECRET;
const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
const awsRegion = process.env.AWS_REGION;
const ciRunnerUrl = process.env.CI_RUNNER_URL;
const sqsQueueUrl = process.env.SQS_QUEUE_URL;

const knex = getKnexObj();

const app = new App({
  appId,
  privateKey,
  webhooks: {
    secret: webhookSecret
  },
});

const messageForNewPRs = "Thank you from pipelineci2024 for opening a new PR!";

async function handlePullRequestOpened({ octokit, payload }) {
console.log("payload=", payload);
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

    const owner  = payload.repository.owner.login;
    const repo   = payload.repository.name;
    const sha    = payload.pull_request.head.sha;
    const branch = payload.pull_request.head.ref;

    try {
      await insertRunsTable(owner, repo, sha, branch);
    } catch (error) {
      console.error('Error updating runs table:', error);
    }

    const payloadForRunner = "";

    await sendRequestToRunner(payloadForRunner);

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

async function sendRequestToRunner(payload) {
  const sqsClient = new SQSClient({ region: awsRegion });

  const params = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(payload),
  };

  try {
      const result = await sqsClient.send(new SendMessageCommand(params));
      console.log('Message sent successfully:', result.MessageId);
  } catch (error) {
      console.error('Error sending message:', error);
  }

}

const insertRunsTable = async (owner, repo, sha, branch) => {
  //
  // fetch org id from organizations based on owner
  //
  const selectOrgResponse = await knex(process.env.ORGANIZATIONS_TABLE_NAME)
    .select('id')
    .where('owner', '=', owner)
    .where('git_provider', '=', 'GITHUB')
    .catch((err) => { console.error(err); throw err; });

  console.log("selectOrgResponse=", selectOrgResponse);
  const organizationId = selectOrgResponse[0].id;

  //
  // fetch project id from projects based on organization_id and repo
  //
  const selectProjectsResponse = await knex(process.env.PROJECTS_TABLE_NAME)
    .select('id')
    .where('repo', '=', repo)
    .where('organization_id', '=', organizationId)
    .catch((err) => { console.error(err); throw err; });

  console.log("selectProjectsResponse=", selectProjectsResponse);
  const projectId = selectProjectsResponse[0].id;

  //
  // insert runs table, update columns sha, branch based on project_id
  //
  const insertRunsResponse = await knex(process.env.RUNS_TABLE_NAME)
    .insert({
      project_id: projectId,
      sha,
      branch,
    })
    .returning('id')
    .catch((err) => { console.error(err); throw err });

  console.log("insertRunsResponse=", insertRunsResponse);
}

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

const server = http.createServer(async (req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    console.log("Health check endpoint request");
    res.writeHead(200);
    res.end("Healthy!");
  }

  if (await webhooksMiddleware(req, res)) return;

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}. Events path "${path}".`);
  console.log('Press Ctrl + C to quit.');
});
