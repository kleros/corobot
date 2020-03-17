const {
  ethers: {
    utils: { parseEther, formatEther }
  }
} = require('ethers')
const alarm = require('../utils/alarm')

module.exports = async ({ signer, signerAddress, chainName, chainId }) => {
  const balance = await signer.getBalance()
  const limit = process.env.BALANCE_THRESHOLD_ETH
    ? parseEther(process.env.BALANCE_THRESHOLD_ETH)
    : parseEther('0.05')

  if (balance.gt(limit)) return

  alarm({
    subject: 'Governor warning: Bot is running low on ETH',
    message: `the governor bot wallet at ${signerAddress} is running low on ETH.\nIf it runs out of ETH it will no longe be able to executeSubmissions and pass periods.\n\n Balance when this email was dispatched: ${formatEther(
      balance
    )} Ξ.`,
    chainName,
    chainId
  })
}
