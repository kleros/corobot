// Run env variable checks.
require('./utils/env-check')

const ethers = require('ethers')
const sgMail = require('@sendgrid/mail')
const _KlerosGovernor = require('@kleros/kleros/build/contracts/KlerosGovernor.json')

const bots = [
  require('./bots/pass-period'),
  require('./bots/no-list-submitted'),
  require('./bots/low-balance')
]

// Setup SendGrid if keys were provided.
const mailingEnvVariablesSet =
  process.env.SENDGRID_API_KEY &&
  process.env.TEMPLATE_ID &&
  process.env.FROM_ADDRESS &&
  process.env.FROM_NAME &&
  process.env.UI_PATH &&
  process.env.WATCHERS

if (mailingEnvVariablesSet) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  sgMail.setSubstitutionWrappers('{{', '}}')
}

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
    currentSessionNumber
  ] = await Promise.all([
    governor.lastApprovalTime(),
    provider.getBlock('latest'),
    governor.submissionTimeout(),
    signer.getAddress(),
    governor.getCurrentSessionNumber()
  ])
  const { timestamp } = latestBlock

  bots.forEach(bot =>
    bot({
      lastApprovalTime,
      timestamp,
      submissionTimeout,
      signerAddress,
      currentSessionNumber,
      signer,
      governor
    })
  )
}, Number(process.env.POLL_INTERVAL_MILLISECONDS) || 5 * 60 * 1000)
