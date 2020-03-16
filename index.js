// Run env variable checks.
require('./utils/env-check')

const ethers = require('ethers')

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL)
provider.pollingInterval = 60 * 1000 // Poll every minute.
;(async () => {
  console.info('Starting bot...')
})()
