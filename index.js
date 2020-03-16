// Run env variable checks.
require('./utils/env-check')

const ethers = require('ethers')
const sgMail = require('@sendgrid/mail')
const _KlerosGovernor = require('@kleros/kleros/build/contracts/KlerosGovernor.json')

const { bigNumberify } = ethers.utils

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
provider.pollingInterval =
  Number(process.env.POLL_INTERVAL_MILLISECONDS) || 5 * 60 * 1000
const governor = new ethers.Contract(
  process.env.GOVERNOR_ADDRESS,
  _KlerosGovernor.abi,
  provider
)

;(async () => {
  console.info('Starting bot...')

  // Watch if we are in the second half of the submission period and no list was submitted.
  // If so, send out emails to notify watchers.
  const notified = false
  setInterval(async () => {
    console.info('Checking alarm...')
    if (notified) return // Already notified watchers.

    const [
      lastApprovalTime,
      submissionTimeout,
      latestBlock
    ] = await Promise.all([
      governor.lastApprovalTime(),
      governor.submissionTimeout,
      provider.getBlock('latest')
    ])
    const { timestamp: now } = latestBlock
    console.info(latestBlock)
    console.info(now)

    // Are we in the second half of the appeal period, and no lists were submitted?
    if (
      bigNumberify(now)
        .sub(lastApprovalTime)
        .gt(submissionTimeout.div(bigNumberify(2)))
    ) {
      console.info('Sounding alarms!')

      // Send out emails, if required keys were provided.
      if (mailingEnvVariablesSet) {
        const emails = JSON.parse(process.env.WATCHERS)
        for (const email of Object.keys(emails)) {
          const nickname = emails[email]
          console.info(`Sending out warning email to ${nickname} at ${email}`)
          sgMail.send({
            to: email,
            from: {
              email: process.env.FROM_ADDRESS,
              name: process.env.FROM_NAME
            },
            templateId: process.env.TEMPLATE_ID,
            dynamic_template_data: {
              nickname,
              subject: 'Governor Warning',
              message: `${nickname}, the Kleros governor at ${governor.address} is in the second half of the submission period and no lists were submitted.`,
              uiPath: process.env.UI_PATH
            }
          })
        }
      }
    }
  }, Number(process.env.POLL_INTERVAL_MILLISECONDS) || 5 * 60 * 1000)
})()
