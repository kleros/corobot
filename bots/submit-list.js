module.exports = async ({
  governor,
  lastApprovalTime,
  submissionTimeout,
  currentSessionNumber
}) => {
  const sessionEnd = lastApprovalTime.add(submissionTimeout).toNumber()

  // This bot will submit an empty list if we are one hour or less
  // from the end of the session.
  // Otherwise, wait.
  const listSubmissionThreshold = process.env.LIST_SUBMISSION_THRESHOLD_SECONDS
    ? Number(process.env.LIST_SUBMISSION_THRESHOLD_SECONDS)
    : 60 * 60 // 1 hour

  if (Date.now() / 1000 < sessionEnd - listSubmissionThreshold) return

  if (Date.now() / 1000 > sessionEnd) return // Wait for the next session.

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

  // Check if no one submitted a list.
  if (submittedListIndexes.length > 0) return

  console.info('Submitting empty list...')

  await governor.submitList([], [], [], [], '', {
    value: submissionDeposit
  })

  console.info('Done submitting list.')
}
