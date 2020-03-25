const ethers = require('ethers')

const { getAddress } = ethers.utils

// Web3
if (!process.env.PROVIDER_URL) {
  console.error(
    'No web3 provider set. Please set the PROVIDER_URL environment variable.'
  )
  process.exit(1)
}

if (
  !process.env.GOVERNOR_ADDRESS ||
  !getAddress(process.env.GOVERNOR_ADDRESS)
) {
  console.error(
    'Governor address not set or incorrect. Please set the GOVERNOR_ADDRESS environment variable.'
  )
  process.exit(1)
}

if (!process.env.SUBMITTER_ADDRESSES) {
  console.error(
    'Submitter addresses not set. Please set the SUBMITTER_ADDRESSES environment variable.'
  )
  process.exit(1)
}

try {
  const submitterAddresses = JSON.parse(process.env.SUBMITTER_ADDRESSES)
  if (!Array.isArray(submitterAddresses)) {
    console.error(
      'SUBMITTER_ADDRESSES should be an array of checksummed addresses'
    )
    process.exit(1)
  }

  // getAddress will throw if one of the addresses is not a checksummed address.
  submitterAddresses.forEach(submitterAddr => getAddress(submitterAddr))
} catch (err) {
  console.error('Error in SUBMITTER_ADDRESSES env variable.')
  console.error(
    'SUBMITTER_ADDRESSES should be an array of checksummed addresses'
  )
  throw err
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

if (!process.env.GOVERNOR_URL) {
  console.error(
    'Governor UI path not set. Please set the GOVERNOR_URL environment variable.'
  )
  process.exit(1)
}

if (!process.env.BOT_URL) {
  console.error(
    'Alarm UI path not set. Please set the BOT_URL environment variable.'
  )
  process.exit(1)
}

if (!process.env.WATCHERS) {
  console.error(
    'Watchers object not set. Please set the WATCHERS environment variable.'
  )
  process.exit(1)
}

if (
  typeof JSON.parse(process.env.WATCHERS) !== 'object' ||
  JSON.parse(process.env.WATCHERS) === null
) {
  console.error(
    'Watchers should be an object mapping emails to nicknames. Please set the WATCHERS environment variable.'
  )
  process.exit(1)
}
