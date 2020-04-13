// Run env variable checks.
require('./utils/env-check')

const http = require('http')
const ethers = require('ethers')
const level = require('level')
const express = require('express')
const logger = require('morgan')
const cors = require('cors')
const bodyParser = require('body-parser')
const _KlerosGovernor = require('@kleros/kleros/build/contracts/KlerosGovernor.json')

const bots = [
  require('./bots/pass-period'),
  require('./bots/no-list-submitted'),
  require('./bots/execute-approved'),
  require('./bots/submit-list')
]

// Setup provider contract instance.
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL)
const signer = new ethers.Wallet(process.env.WALLET_KEY, provider)
const governor = new ethers.Contract(
  process.env.GOVERNOR_ADDRESS,
  _KlerosGovernor.abi,
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
    submissionDeposit
  ] = await Promise.all([
    governor.lastApprovalTime(),
    provider.getBlock('latest'),
    governor.submissionTimeout(),
    signer.getAddress(),
    governor.getCurrentSessionNumber(),
    provider.getNetwork(),
    governor.submissionDeposit()
  ])
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
      submissionDeposit,
      provider
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

// Configure and start server.
// The server is used to watch the alarm status and request disarm.

/**
 * Event listener for HTTP server "error" event.
 * @param {object} error The error object.
 */
const onError = error => {
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

const router = require('./routes')(db)

const app = express()
app.use('*', cors())
app.options('*', cors())
app.use(logger('dev'))
app.use(bodyParser.json())
app.use('/api', router)
app.use(express.static(`${__dirname}/public/`))

/**
 * Event listener for HTTP server "listening" event.
 */
const onListening = () => {
  const addr = server.address()
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
