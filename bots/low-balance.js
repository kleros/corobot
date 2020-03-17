const {
  ethers: {
    utils: { parseEther, formatEther }
  }
} = require('ethers')
const alarm = require('../utils/alarm')

const DB_KEY = 'LOW_BALANCE'

module.exports = async ({ signer, signerAddress, chainName, chainId, db }) => {
  const balance = await signer.getBalance()
  const threshold = process.env.BALANCE_THRESHOLD_ETH
    ? parseEther(process.env.BALANCE_THRESHOLD_ETH)
    : parseEther('0.05')

  // Do we have enough funds?
  if (balance.gt(threshold)) return

  // Did 48 hours pass since the last alarm?
  let lastAlarmTime = 0
  try {
    lastAlarmTime = db.get(DB_KEY)
  } catch (err) {
    if (err.type !== 'NotFoundError') throw new Error(err)
  }

  const nowHours = Date.now() / 1000 / 60 / 60
  if (nowHours - lastAlarmTime < 48) return

  await db.put(DB_KEY, nowHours)
  alarm({
    subject: 'Governor warning: Bot is running low on ETH',
    message: `the governor bot wallet at ${signerAddress} is running low on ETH.\nIf it runs out of ETH it will no longe be able to executeSubmissions and pass periods.\n\n Balance when this email was dispatched: ${formatEther(
      balance
    )} Ξ.`,
    chainName,
    chainId
  })
}
