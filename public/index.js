/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/**
 * Disarms the alarm for the current session.
 */
async function disarm() {
  let response
  try {
    const { ethers, ethereum, web3 } = window
    if (!ethereum || !web3)
      throw new Error('No web3 detected. A web3 browser is required.')

    const provider = new ethers.providers.Web3Provider(web3.currentProvider)
    const signer = provider.getSigner()

    await ethereum.enable()
    const signerAddr = await signer.getAddress()
    const message = `Kleros Alarm Auth: My address is ${signerAddr}.`
    const signature = await signer.signMessage(message)

    response = await (
      await fetch(`/api/disarm`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          signerAddr
        })
      })
    ).json()

    if (response.status === 'failed')
      response = response.errors
        .map(e => JSON.stringify(e))
        .reduce((acc, curr) => (acc ? `${acc}, ${curr}` : curr))
    else response = response.message
  } catch (err) {
    response = err.message
  }

  document.querySelector('#lbl-response').innerHTML = response
}
