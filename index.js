// Run env variable checks.
require('./utils/env-check')

const ethers = require('ethers')
const _KlerosGovernor = require('@kleros/kleros/build/contracts/KlerosGovernor.json')

const bots = [
  require('./bots/pass-period'),
  require('./bots/no-list-submitted'),
  require('./bots/low-balance')
]

// Setup provider contract instance.
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL)
const signer = new ethers.Wallet(process.env.WALLET_KEY, provider)
const governor = new ethers.Contract(
  process.env.GOVERNOR_ADDRESS,
  _KlerosGovernor.abi,
  signer
)

setInterval(async () => {
  console.info('Running bot...')
  const [
    lastApprovalTime,
    latestBlock,
    submissionTimeout,
    signerAddress,
    currentSessionNumber,
    network
  ] = await Promise.all([
    governor.lastApprovalTime(),
    provider.getBlock('latest'),
    governor.submissionTimeout(),
    signer.getAddress(),
    governor.getCurrentSessionNumber(),
    signer.getNetwork()
  ])
  const { timestamp } = latestBlock
  const { name: chainName, chainId } = network

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
      chainName
    })
  )
}, Number(process.env.POLL_INTERVAL_MILLISECONDS) || 5 * 60 * 1000)
