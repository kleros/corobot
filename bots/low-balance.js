const {
  ethers: {
    utils: { parseEther, formatEther }
  }
} = require('ethers')

const alarm = require('../utils/alarm')
const { LOW_BALANCE } = require('../utils/db-keys')

module.exports = async ({ signer, signerAddress, chainName, chainId, db }) => {
  let balance
  try {
    balance = await signer.getBalance()
    console.info('Wallet balance:', formatEther(balance))
  } catch (err) {
    console.error('Error fetching signer balance.')
    throw err
  }

  const threshold = process.env.BALANCE_THRESHOLD_ETH
    ? parseEther(process.env.BALANCE_THRESHOLD_ETH)
    : parseEther('0.05')

  // Do we have enough funds?
  if (balance.gt(threshold)) return

  // Did 48 hours pass since the last alarm?
  let lastAlarmTime = 0
  try {
    lastAlarmTime = await db.get(LOW_BALANCE)
  } catch (err) {
    if (err.type !== 'NotFoundError') throw new Error(err)
  }

  const nowHours = Date.now() / 1000 / 60 / 60
  if (nowHours - lastAlarmTime < 24 * 3) return

  console.info('Wallet balance is below threshold.')
  console.info('Balance threshold:', process.env.BALANCE_THRESHOLD_ETH)
  console.info('Last alarm time:', new Date(lastAlarmTime * 60 * 60 * 1000))
  console.info('')

  await db.put(LOW_BALANCE, JSON.stringify(nowHours))
  alarm({
    subject: 'Governor warning: Bot is running low on ETH',
    message: `the governor bot wallet at ${signerAddress} is running low on ETH.\nIf it runs out of ETH it will no longe be able to executeSubmissions and pass periods.\n\n Balance when this email was dispatched: ${formatEther(
      balance
    )} Ξ.`,
    chainName,
    chainId
  })
}
