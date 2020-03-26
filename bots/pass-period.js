const ethers = require('ethers')
const { NO_LIST_SUBMITTED } = require('../utils/db-keys')
const {
  STATUS: { NO_DISPUTE }
} = require('../utils/enums')

const { bigNumberify } = ethers.utils

// If the session is over, calls executeSubmissions to start
// a new session.
module.exports = async ({
  governor,
  lastApprovalTime,
  submissionTimeout,
  currentSessionNumber,
  timestamp,
  db
}) => {
  // Are we still in the submission period?
  if (
    bigNumberify(timestamp)
      .sub(lastApprovalTime)
      .lte(submissionTimeout)
  )
    return

  // Submission period is over. Was there a dispute in the last session?
  const session = await governor.sessions(currentSessionNumber)
  if (session.status !== NO_DISPUTE) return

  console.info('In approval period, calling executeSubmissions...')
  try {
    await governor.executeSubmissions()
    await db.put(
      NO_LIST_SUBMITTED,
      JSON.stringify({
        lastAlarmTime: 0,
        notificationCount: 0,
        currentSessionNumber: currentSessionNumber.toNumber() + 1,
        disarmed: false
      })
    )
  } catch (err) {
    console.error('Error executing submissions')
    console.error(err)
    return
  }

  console.info('Done calling executeSubmissions.')
}
