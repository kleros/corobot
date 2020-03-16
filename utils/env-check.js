// Web3
if (!process.env.PROVIDER_URL) {
  console.error(
    'No web3 provider set. Please set the PROVIDER_URL environment variable'
  )
  process.exit(1)
}
