const ethers = require('ethers')
const { NO_LIST_SUBMITTED } = require('../utils/db-keys')

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
  // Are we in the approval period?
  if (
    bigNumberify(timestamp)
      .sub(lastApprovalTime)
      .gt(submissionTimeout)
  ) {
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
}
