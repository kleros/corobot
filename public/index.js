/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/**
 * Disarms the alarm for the current session.
 */
async function disarm() {
  const { ethers } = window
  const provider = new ethers.providers.Web3Provider(web3.currentProvider)
  const signer = provider.getSigner()

  let response
  try {
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
