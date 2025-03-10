# Pipelineci - User's Guide

Steps to use PipelineCI to perform CI checks, similar to CircleCI.

## Create account on pipelineCI platform

Create an account on [pipelineCI](https://pipelineci.com/) platform.

## Create organization and install app on repos

* Once logged-in, create an organization. Organization on pipelineCI platform has one-on-one correspondence with an account on GitHub.
* On clicking `Create Organization`, the app will take you to GitHub's `Install app` authorization interface.
* Authorize the `pipeline2024` access to a select or all repos.

## Add pipelineci.sh to repo

* Create a repo on GitHub for which you want to run CI checks.
* Clone the repo to your machine.
* Create a file `pipelineci.sh` in your repo's root folder.
* Enable execute permission for pipelineci.sh: `chmod +x pipelineci.sh`.
* Add any checks that you wish run in your repo.

## Create a pull request

* Create a pull request on GitHub's UI.
* Notice results of checks on `Conversation` tab within the `Pull requests` tab.

## Look at success/failure status on platform

* On the PipelineCI platform, click on `Projects` button on navigation bar.
* On the project's page, select the organization from drop-down list.
* A list of authorized repos is displayed along with a `Show Runs` link for each repo.
* Click on the `Show Runs` link for a project.
* On the Runs page, CI runs for the project are displayed here.
