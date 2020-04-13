<p align="center">
  <b style="font-size: 32px;">Corobot</b>
</p>

<p align="center">
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="JavaScript Style Guide"></a>
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg" alt="Conventional Commits"></a>
  <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen Friendly"></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Styled with Prettier"></a>
</p>

A Bot to watch for Kleros Governor events and respond with notifications and transactions.

## Description

> Words in ALL_CAPS are environment variables. See [`.env.example`](.env.example) for more information on them.

This software consists of 5 modules that monitor the state of an instance of Kleros Governor:

### 1. Execute Approved
Executes approved transactions in the previous session.

### 2. No List
Monitors submitted lists for the current session. If none of the submitters (SUBMITTER_ADDRESSES) made a submission during the first half of the session, this module will send emails to the watchers (WATCHERS) more and more frequently until either:
- One of the submitters (SUBMITTER_ADDRESSES) submits a list;
- One of the submitters (SUBMITTER_ADDRESSES) disarms the alarm.

### 3. Pass Period
If the submission period of the current session is over is not marked as disputed, the bot will submit a transaction to execute submissions:
- If no one made a submission, it will move the governor to the next session.
- If there is only one submitted list, it will mark it as approved and move the contract to the next session.
- If there is more than one submission, it will raise a dispute.

### 4. Submit List
If we are approaching the end of the submission period (LIST_SUBMISSION_THRESHOLD_SECONDS) and none of the submitters (SUBMITTER_ADDRESSES) made a submission, the bot will submit an empty list.
> This will raise a dispute if someone made a submission.

> The bot's wallet needs to have enough ETH to pay for gas + the submission deposit.

### 5. Alarm UI
The Alarm UI allows the submitters to disarm the alarm for the current session. A web3 enabled browser is required.

## Prerequisites

- Tested on NodeJS version 11

## Get Started

1.  Clone this repo.
2.  Duplicate `.env.example`, rename it to `.env` and fill in the environment variables.
3.  Run `yarn` to install dependencies and then `yarn start` to run the service in development mode.

> To run the service in production mode use `node -r dotenv/config index.js`.

> To start with PM2 use `pm2 start --node-args="-r dotenv/config" index.js --name corobot`

## Other Scripts

- `yarn format` - Lint, fix and prettify all the project.
.js files with styled components and .js files.
- `yarn run cz` - Run commitizen.

## Contributing

See CONTRIBUTING.md.