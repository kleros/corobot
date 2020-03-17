// Web3
if (!process.env.PROVIDER_URL) {
  console.error(
    'No web3 provider set. Please set the PROVIDER_URL environment variable'
  )
  process.exit(1)
}

if (!process.env.GOVERNOR_ADDRESS) {
  console.error(
    'Governor address not set. Please set the GOVERNOR_ADDRESS environment variable'
  )
  process.exit(1)
}

if (!process.env.SUBMITTER_ADDRESS) {
  console.error(
    'Submitter address not set. Please set the SUBMITTER_ADDRESS environment variable'
  )
  process.exit(1)
}

if (!process.env.WALLET_KEY) {
  console.error(
    'Private key not set. Please set the WALLET_KEY environment variable so the bot can send transactions to execute submissions'
  )
  process.exit(1)
}
