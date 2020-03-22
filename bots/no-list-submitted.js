const alarm = require('../utils/alarm')
const { NO_LIST_SUBMITTED: DB_KEY } = require('../utils/db-keys')

module.exports = async ({
  governor,
  lastApprovalTime,
  timestamp,
  currentSessionNumber,
  chainName,
  submissionTimeout,
  chainId,
  db
}) => {
  let state = {
    lastAlarmTime: 0,
    notificationCount: 0,
    currentSessionNumber: currentSessionNumber.toNumber(),
    disarmed: false
  }

  try {
    const savedState = JSON.parse(await db.get(DB_KEY))

    // Check if we already sent at least one alarm for this session.
    // If so, load the state from the DB to check if we should send another one.
    if (
      Number(savedState.currentSessionNumber) ===
      state.currentSessionNumber - 1
    )
      state = savedState
  } catch (err) {
    if (err.type !== 'NotFoundError') throw new Error(err)
  }

  const { lastAlarmTime, notificationCount, disarmed } = state

  // Check if the alarm was manually disarmed for this sesion.
  if (disarmed) return

  let nextAlarmThreshold =
    lastApprovalTime.toNumber() +
    submissionTimeout.toNumber() * (1 - 1 / (notificationCount + 2))

  if (nextAlarmThreshold < lastAlarmTime + 60 * 60)
    nextAlarmThreshold = lastAlarmTime + 60 * 60

  if (timestamp < nextAlarmThreshold) return // Did not reach threshold yet.

  // Did any of the SUBMITTER_ADDRESSESES submit a list
  // before the alarm thershold?
  let submittedListIndexes
  try {
    submittedListIndexes = await governor.getSubmittedLists(
      currentSessionNumber
    )
  } catch (err) {
    console.error(
      `Error getting submitted lists. currentSessionNumber: ${currentSessionNumber.toString()}`
    )
    throw err
  }

  if (submittedListIndexes.length === 0) {
    await alarm({
      subject: `Governor Warning: No one submitted a list for this session.`,
      message: `no one made any submissions in the current session. \n Please visit ${process.env.UI_PATH} and submit a list ASAP!`,
      chainName,
      chainId
    })
    await db.put(
      DB_KEY,
      JSON.stringify({
        lastAlarmTime: timestamp,
        notificationCount: notificationCount + 1,
        currentSessionNumber: currentSessionNumber.toNumber()
      })
    )
    return
  }

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

  const submitterAddresses = JSON.parse(process.env.SUBMITTER_ADDRESSES)
  if (
    !submittedLists
      .map(({ submitter }) => submitter)
      .some(submitter => submitterAddresses.includes(submitter))
  ) {
    await alarm({
      subject: `Governor Warning: Someone submitted a list to governor but none of the team members did.`,
      message: `no submissions were made by the whitelisted addresses in the current session, but another address submitted a list. \n Please visit ${process.env.UI_PATH}, check the submission and if needed, submit a list ASAP!`,
      chainName,
      chainId
    })
    await db.put(
      DB_KEY,
      JSON.stringify({
        lastAlarmTime: timestamp,
        notificationCount: notificationCount + 1,
        currentSessionNumber: currentSessionNumber.toNumber()
      })
    )
  }
}
