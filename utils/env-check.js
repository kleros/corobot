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
