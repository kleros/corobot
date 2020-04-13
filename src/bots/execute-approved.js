const ethers = require('ethers')

const { bigNumberify } = ethers.utils
const { LAST_EXECUTED_SESSION } = require('../utils/db-keys')

// Executes transactions approved in the last session, if any.
module.exports = async ({ governor, currentSessionNumber, db, timestamp }) => {
  const sessionToExecute = currentSessionNumber.toNumber() - 1
  if (sessionToExecute <= 0) return // We are in the very first session. Nothing to execute yet.

  let lastExecutedSession = 0
  try {
    lastExecutedSession = Number(await db.get(LAST_EXECUTED_SESSION))
  } catch (err) {
    if (err.type !== 'NotFoundError') throw new Error(err)
  }

  if (lastExecutedSession === sessionToExecute) return // Already executed transactions from this session.

  const [submissionIndexes, executionTimeout] = await Promise.all([
    governor.getSubmittedLists(sessionToExecute),
    governor.executionTimeout()
  ])

  const approvedSubmissions = (
    await Promise.all(
      submissionIndexes.map(async listID => ({
        listID,
        ...(await governor.submissions(listID))
      }))
    )
  ).filter(a => a.approved)

  if (approvedSubmissions.length === 0) return // No approved transactions.

  const { listID, approvalTime } = approvedSubmissions[0]

  if (
    bigNumberify(timestamp)
      .sub(approvalTime)
      .lte(executionTimeout)
  )
    return // Time to execute transactions has passed.

  console.info('Executing approved transactions for session', sessionToExecute)
  console.info('Approved List ID', listID.toNumber())
  await governor.executeTransactionList(listID, 0, 0)

  await db.put(LAST_EXECUTED_SESSION, JSON.stringify(sessionToExecute))
  console.info('Done executing approved transactions.')
}
