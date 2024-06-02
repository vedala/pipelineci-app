import { App } from '@octokit/app';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = new App({
  id:         process.env.GITHUB_APP_IDENTIFIER,
  privateKey: process.env.PRIVATE_KEY
});

const getInstallationAccessToken = async(owner, repo) => {
  const result = await fetch(`https://api.github.com/repos/${owner}/${repo}/installation`,
    {
      headers: {
        authorizatin: `Bearer ${jwt}`,
        accept: 'application/vnd.github.machone-main-preview+json',
      },
  });

  const installationId = (await result.json()).id;

  const installationAccessToken = await app.getInstallationAccessToken({
    installationId,
  });

  return installationAccessToken;
};

export default getInstallationAccessToken;
