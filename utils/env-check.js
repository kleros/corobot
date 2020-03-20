// Web3
if (!process.env.PROVIDER_URL) {
  console.error(
    'No web3 provider set. Please set the PROVIDER_URL environment variable.'
  )
  process.exit(1)
}

if (!process.env.GOVERNOR_ADDRESS) {
  console.error(
    'Governor address not set. Please set the GOVERNOR_ADDRESS environment variable.'
  )
  process.exit(1)
}

if (!process.env.SUBMITTER_ADDRESSES) {
  console.error(
    'Submitter addresses not set. Please set the SUBMITTER_ADDRESSES environment variable.'
  )
  process.exit(1)
}

if (!process.env.WALLET_KEY) {
  console.error(
    'Private key not set. Please set the WALLET_KEY environment variable so the bot can send transactions to execute submissions'
  )
  process.exit(1)
}

if (!process.env.SENDGRID_API_KEY) {
  console.error(
    'SendGrid key not set. Please set the SENDGRID_API_KEY environment variable.'
  )
  process.exit(1)
}
if (!process.env.TEMPLATE_ID) {
  console.error(
    'SendGrid template ID not set. Please set the TEMPLATE_ID environment variable.'
  )
  process.exit(1)
}
if (!process.env.FROM_ADDRESS) {
  console.error(
    'Email from address not set. Please set the FROM_ADDRESS environment variable.'
  )
  process.exit(1)
}
if (!process.env.FROM_NAME) {
  console.error(
    'Email from name field not set. Please set the FROM_NAME environment variable.'
  )
  process.exit(1)
}
if (!process.env.UI_PATH) {
  console.error('UI path not set. Please set the UI_PATH environment variable.')
  process.exit(1)
}
if (!process.env.WATCHERS) {
  console.error(
    'Watchers object not set. Please set the WATCHERS environment variable.'
  )
  process.exit(1)
}
