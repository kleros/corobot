const ethers = require('ethers')

const alarm = require('../utils/alarm')
const { NO_LIST_SUBMITTED } = require('../utils/db-keys')

// Used to ensure addresses are in checksummed format.
const { getAddress } = ethers.utils

// Sends an email to every WATCHER if we passed
// the alarm threshold for this session and none of
// the SUBMITTER_ADDRESSES submitted a list.
module.exports = async ({
  governor,
  lastApprovalTime,
  timestamp,
  currentSessionNumber,
  chainName,
  submissionTimeout,
  chainId,
  signerAddress,
  db
}) => {
  let state = {
    lastAlarmTime: 0,
    notificationCount: 0,
    currentSessionNumber: currentSessionNumber.toNumber(),
    disarmed: false
  }

  try {
    const savedState = JSON.parse(await db.get(NO_LIST_SUBMITTED))

    // Check if we already sent at least one alarm for this session.
    // If so, load the state from the DB to check if we should send another one.
    if (
      savedState &&
      Number(savedState.currentSessionNumber) === state.currentSessionNumber
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

  if (timestamp > lastApprovalTime.add(submissionTimeout).toNumber()) return // Submission period is over

  // Did anyone submit a list before the alarm thershold?
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

  const submitterAddresses = JSON.parse(
    process.env.SUBMITTER_ADDRESSES
  ).map(submitter => getAddress(submitter))
  submitterAddresses.push(signerAddress)

  if (submittedListIndexes.length === 0) {
    await alarm({
      subject: `Governor Warning: None of the submitters made a submission in this session.`,
      message: `no one made any submissions in the current session.
      <br>
      <br>Please visit ${process.env.GOVERNOR_URL} and submit a list ASAP!
      <br>
      <br>The bot will continue issuing warning emails until one of the submitters either submit a list or disarms the alarm for this session.
      <br>
      <br>The submitters are:${submitterAddresses.map(
        submitterAddress => `<br>${submitterAddress}`
      )}`,
      chainName,
      chainId,
      secondary: `To disable the alarm for this section, click <a href="${process.env.BOT_URL}">here</a>`
    })
    await db.put(
      NO_LIST_SUBMITTED,
      JSON.stringify({
        lastAlarmTime: timestamp,
        notificationCount: notificationCount + 1,
        currentSessionNumber: currentSessionNumber.toNumber()
      })
    )
    return
  }

  // Is the submitter one of SUBMITTER_ADDRESSES?
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
      .map(({ submitter }) => getAddress(submitter))
      .some(submitter => submitterAddresses.includes(getAddress(submitter)))
  ) {
    await alarm({
      subject: `Governor Warning: Someone submitted a list to governor but none of the team members did.`,
      message: `no submissions were made by the submitters in the current session, but another someone else did.
      <br>
      <br>Please visit <a href="${
        process.env.GOVERNOR_URL
      }">the governor UI</a> to check the submission:
      <br>
      <br>- If the team thinks the submission is OK, one of the submitters can disarm the alarm by visiting the UI <a href="${
        process.env.BOT_URL
      }">here</a>.
      <br>
      <br>- If the submission is not ok, please submit a list (from one of the submitter addresses) to generate a dispute.
      <br>
      <br>The bot will continue issuing warning emails until one of the submitters either submit a list or disarms the alarm for this session.
      <br>
      <br>The submitters are:${submitterAddresses.map(
        submitterAddress => `<br>${submitterAddress}`
      )}`,
      chainName,
      chainId,
      secondary: `To disable the alarm for this section, click <a href="${process.env.BOT_URL}">here</a>`
    })
    await db.put(
      NO_LIST_SUBMITTED,
      JSON.stringify({
        lastAlarmTime: timestamp,
        notificationCount: notificationCount + 1,
        currentSessionNumber: currentSessionNumber.toNumber()
      })
    )
  }
}
