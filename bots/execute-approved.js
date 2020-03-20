const DB_KEY = 'LAST_EXECUTED_SESSION'

module.exports = async ({ governor, currentSessionNumber, db }) => {
  const sessionToExecute = currentSessionNumber.toNumber() - 1
  if (sessionToExecute <= 0) return // We are in the very first session. Nothing to execute yet.

  let lastExecutedSession = 0
  try {
    lastExecutedSession = Number(await db.get(DB_KEY))
  } catch (err) {
    if (err.type !== 'NotFoundError') throw new Error(err)
  }

  if (lastExecutedSession === sessionToExecute) return // Already executed transactions from this session.

  const submissionIndexes = await governor.getSubmittedLists(sessionToExecute)

  const approvedSubmission = (
    await Promise.all(
      submissionIndexes.map(async listID => ({
        listID,
        ...(await governor.submissions(listID))
      }))
    )
  ).filter(a => a.approved)

  if (approvedSubmission.length === 0) {
    return
  }

  const listID = approvedSubmission[0].listID

  console.info('Executing approved transactions for session', sessionToExecute)
  console.info('Approved List ID', listID.toNumber())
  await governor.executeTransactionList(listID, 0, 0)

  await db.put(DB_KEY, sessionToExecute)
  console.info('Done executing approved transactions.')
  console.info('')
}
