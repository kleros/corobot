// Run env variable checks.
import * as dotenv from 'dotenv'

// Load environment variables.
dotenv.config()
import './utils/env-check'

import * as http from 'http'
import * as ethers from 'ethers'
import * as level from 'level'
import * as express from 'express'
import * as logger from 'morgan'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'
import * as _KlerosGovernor from './abis/KlerosGovernor.json'
import * as _IArbitrator from '@kleros/erc-792/build/contracts/IArbitrator.json'
import * as path from "path"
import { AddressInfo } from 'net'

import passPeriod from './bots/execute-submissions'
import executeApproved from './bots/execute-approved'

const bots: Function[] = [
  passPeriod,
  executeApproved,
]

// Setup provider contract instance.
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL)
const signer = new ethers.Wallet(process.env.WALLET_KEY as string, provider)
const governor = new ethers.Contract(
  process.env.GOVERNOR_ADDRESS as string,
  _KlerosGovernor,
  signer
)

// Open DB
const db = level('./db')

console.info('Booting...')
const runBots = async () => {
  console.info('')
  console.info('Checking alarms...')
  const [
    lastApprovalTime,
    latestBlock,
    submissionTimeout,
    signerAddress,
    currentSessionNumber,
    network,
    submissionBaseDeposit,
    arbitratorExtraData,
    arbitratorAddress
  ] = await Promise.all([
    governor.lastApprovalTime(),
    provider.getBlock('latest'),
    governor.submissionTimeout(),
    signer.getAddress(),
    governor.getCurrentSessionNumber(),
    provider.getNetwork(),
    governor.submissionBaseDeposit(),
    governor.arbitratorExtraData(),
    governor.arbitrator()
  ])
  const arbitrator = new ethers.Contract(
    arbitratorAddress,
    _IArbitrator.abi,
    signer
  )
  const { timestamp } = latestBlock
  const { name: chainName, chainId } = network
  console.info('Bot wallet:', signerAddress)
  console.info('Network   :', chainName)

  bots.forEach(bot =>
    bot({
      lastApprovalTime,
      timestamp,
      submissionTimeout,
      signerAddress,
      currentSessionNumber,
      signer,
      governor,
      chainId,
      chainName,
      db,
      submissionBaseDeposit,
      provider,
      arbitratorExtraData,
      arbitrator
    })
  )
}

runBots() // Run bots on startup.
setInterval(
  runBots,
  process.env.POLL_INTERVAL_MILLISECONDS
    ? Number(process.env.POLL_INTERVAL_MILLISECONDS)
    : 5 * 60 * 1000 // Default, 5 minutes
)

// Setup event listener bots.
;(async () => {
  const { name: chainName, chainId } = await provider.getNetwork()
  governor.on("ListSubmitted", async from => {
    // Is the submitter one of WHITELISTED_ADDRESSES?
    const submitterAddresses = JSON.parse(
      process.env.WHITELISTED_ADDRESSES as string
    ).map((submitter: string) => getAddress(submitter))

    if (
      !submitterAddresses.includes(getAddress(from))
    ) {
      await alarm({
        emails: JSON.parse(process.env.WATCHERS as string),
        subject: `Governor Warning: Unknown submitter.`,
        message: `Someone submitted a list to governor from an address that is in the submitters list.
        <br>
        <br>Please visit <a href="${
          process.env.GOVERNOR_URL
        }">the governor UI</a> to check the submission:
        <br>
        <br>- If the team thinks the submission is OK, one of the submitters can disarm the alarm by visiting the UI <a href="${
          process.env.BOT_URL
        }">here</a>.
        <br>
        <br>- If the submission is not ok, please submit a list (from one of the submitter addresses) to generate a dispute.
        <br>
        <br>The bot will continue issuing warning emails until one of the submitters either submit a list or disarms the alarm for this session.
        <br>
        <br>The submitters are:${submitterAddresses.map(
          (submitterAddress: string) => `<br>${submitterAddress}`
        )}`,
        chainName,
        chainId,
        secondary: `To disable the alarm for this session, click <a href="${process.env.BOT_URL}">here</a>`,
        templateId: process.env.WARNING_TEMPLATE_ID
      })

      console.info('Dispatched unknown submitter email alarm.')
    }
  });
})()

// Configure and start server.
// The server is used to watch the alarm status and request disarm.

/**
 * Event listener for HTTP server "error" event.
 * @param {object} error The error object.
 */
const onError = (error: { syscall: string, code: string }) => {
  if (error.syscall !== 'listen') throw error

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`)
      throw new Error(`${bind} requires elevated privileges`)
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`)
      throw new Error(`${bind} is already in use`)
    default:
      throw error
  }
}

import routerBuilder from './routes'
import { getAddress } from 'ethers/utils'
import alarm from './utils/alarm'
const router = routerBuilder(db)

const app = express()
app.use('*', cors())
app.options('*', cors())
app.use(logger('dev'))
app.use(bodyParser.json())
app.use('/api', router)
app.use(express.static(path.join(__dirname, '..', 'public')));

/**
 * Event listener for HTTP server "listening" event.
 */
const onListening = () => {
  const addr: AddressInfo = server.address() as AddressInfo
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`
  console.info('Listening on', bind)
  console.info('')
}

const port = process.env.PORT || '3000'
app.set('port', port)

const server = http.createServer(app)
server.listen(port)
server.on('error', onError)
server.on('listening', onListening)
