const alarm = require('../utils/alarm')
const { truncateETHAddress } = require('../utils/strings')

const DB_KEY = 'NO_LIST_SUBMITTED'

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
  // Did we pass the net alarm threshold.
  let state = {
    lastAlarmTime: 0,
    notificationCount: 0,
    currentSessionNumber: currentSessionNumber.toNumber()
  }
  try {
    const savedState = JSON.parse(await db.get(DB_KEY))
    if (Number(savedState.currentSessionNumber) === state.currentSessionNumber)
      state = savedState
  } catch (err) {
    if (err.type !== 'NotFoundError') throw new Error(err)
  }

  const { lastAlarmTime, notificationCount } = state

  let nextAlarmThreshold =
    lastApprovalTime.toNumber() +
    submissionTimeout.toNumber() * (1 - 1 / (notificationCount + 2))

  if (nextAlarmThreshold < lastAlarmTime + 60 * 60)
    nextAlarmThreshold = lastAlarmTime + 60 * 60

  if (timestamp < nextAlarmThreshold) return

  // Did address SUBMITTER_ADDRESS submit a list
  // before 3 days since lastApprovalTime?
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
      subject: `Governor Warning: ${truncateETHAddress(
        process.env.SUBMITTER_ADDRESS
      )} did not submit a list.`,
      message: `no submissions by ${process.env.SUBMITTER_ADDRESS} found for the current session. \n Please visit ${process.env.UI_PATH} and submit a list ASAP!`,
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

  if (
    !submittedLists
      .map(({ submitter }) => submitter)
      .includes(process.env.SUBMITTER_ADDRESS)
  ) {
    await alarm({
      subject: `Governor Warning: Someone submitted a list to governor but ${truncateETHAddress(
        process.env.SUBMITTER_ADDRESS
      )} did not.`,
      message: `no submissions by ${process.env.SUBMITTER_ADDRESS} found for the current session, but another address submitted a list. \n Please visit ${process.env.UI_PATH}, check the submission and submit a list ASAP!`,
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
