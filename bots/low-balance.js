const {
  ethers: {
    utils: { parseEther, formatEther }
  }
} = require('ethers')

const alarm = require('../utils/alarm')
const { LOW_BALANCE } = require('../utils/db-keys')

// Sends out email to WATCHERS, if the bot wallet has less than
// BALANCE_THRESHOLD_ETH ETH.
module.exports = async ({
  signer,
  signerAddress,
  chainName,
  chainId,
  db,
  submissionDeposit
}) => {
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
  const period = process.env.BALANCE_ALARM_PERIOD_HOURS
    ? Number(process.env.BALANCE_ALARM_PERIOD_HOURS)
    : 24 * 3
  if (nowHours - lastAlarmTime < period) return

  console.info('Wallet balance is below threshold.')
  console.info('Balance threshold:', process.env.BALANCE_THRESHOLD_ETH, 'ETH')

  await db.put(LOW_BALANCE, JSON.stringify(nowHours))
  alarm({
    subject: 'Governor warning: Bot is running low on ETH',
    message: `the governor bot uses the ${signerAddress} wallet to perform the following functions:
    <br> - Pass periods;
    <br> - Execute approved transactions;
    <br> - Submit an empty list as a last resort.
    <br>
    <br>To pass periods and execute transactions it only needs gas, but to submit a list it also needs to place a deposit of ${formatEther(
      submissionDeposit
    )} Ξ. Therefore the wallet balance should always be above that amount. The bot will stop complaining if the wallet balance is above ${
      process.env.BALANCE_THRESHOLD_ETH
    } Ξ.
    <br>
    <br>If the wallet has less then ${formatEther(
      submissionDeposit
    )} but more than zero, it will still be able to pass periods an execute approved transactions, however it will not be able to submit a list, in the case of an emergency.
    <br>
    <br>If the wallet reaches zero, it will also not be able to pass periods or execute transactions.
    <br>
    <br>Please fund it.
    <br>
    <br> Balance when this email was dispatched: ${formatEther(balance)} Ξ.`,
    chainName,
    chainId
  })
}
