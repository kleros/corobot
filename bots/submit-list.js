const ethers = require('ethers')
const { NO_LIST_SUBMITTED } = require('../utils/db-keys')

// Used to ensure addresses are in checksummed format.
const { getAddress } = ethers.utils

// Submits an empty list of transactions if all conditions
// below are met:
// - We passed LIST_SUBMISSION_THRESHOLD_SECONDS;
// - The session is not over;
// - None lists were submitted by SUBMITTER_ADDRESSES;
// - The alarm is not disarmed for this session.
module.exports = async ({
  governor,
  lastApprovalTime,
  submissionTimeout,
  currentSessionNumber,
  db
}) => {
  // Check if someone disarmed the alarm for this session
  let disarmed
  try {
    const savedState = JSON.parse(await db.get(NO_LIST_SUBMITTED))
    disarmed =
      savedState &&
      savedState.disarmed &&
      Number(savedState.currentSessionNumber) ===
        currentSessionNumber.toNumber()
  } catch (err) {
    if (err.type !== 'NotFoundError') throw new Error(err)
  }
  if (disarmed) return

  const sessionEnd = lastApprovalTime.add(submissionTimeout).toNumber()

  // This bot will submit an empty list if we are one hour or less
  // from the end of the session.
  // Otherwise, wait.
  const listSubmissionThreshold = process.env.LIST_SUBMISSION_THRESHOLD_SECONDS
    ? Number(process.env.LIST_SUBMISSION_THRESHOLD_SECONDS)
    : 60 * 60 // 1 hour

  if (Date.now() / 1000 < sessionEnd - listSubmissionThreshold) return

  if (Date.now() / 1000 > sessionEnd) return // Wait for the next session.

  console.info('Within list submission period')

  let submittedListIndexes
  let submissionDeposit
  try {
    ;[submittedListIndexes, submissionDeposit] = await Promise.all([
      governor.getSubmittedLists(currentSessionNumber),
      governor.submissionDeposit()
    ])
  } catch (err) {
    console.error(`Error getting submitted lists or submission deposit value.`)
    throw err
  }

  // Check if one of the whitelisted addresses submitted a list.
  let submittedLists
  try {
    submittedLists = await Promise.all(
      submittedListIndexes.map(i => governor.submissions(i.toString()))
    )
  } catch (err) {
    console.error(
      `Error fetching submissions. Indexes ${submittedListIndexes.map(i =>
        i.toString()
      )}`
    )
    throw err
  }

  const submitterAddresses = JSON.parse(
    process.env.SUBMITTER_ADDRESSES
  ).map(submitter => getAddress(submitter))

  if (
    submittedLists
      .map(({ submitter }) => getAddress(submitter))
      .some(submitter => submitterAddresses.includes(submitter))
  ) {
    console.info('One of the whitelisted addresses submitted a list.')
    return
  }

  console.info(
    'Alarm is not disarmed, submission threshold passed and none of SUBMITTER_ADDRESSES sent a list.'
  )
  console.info('Submitting empty list...')

  await governor.submitList([], [], [], [], '', {
    value: submissionDeposit
  })

  console.info('Done submitting list.')
}
