/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/**
 * Disarms the alarm for the current session.
 */
async function disarm() {
  let response
  try {
    response = (
      await (
        await fetch(`/api/disarm`, {
          method: 'post'
        })
      ).json()
    ).message
  } catch (err) {
    response = err.message
  }

  document.querySelector('#lbl-response').innerHTML = response
}
