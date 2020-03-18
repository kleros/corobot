const ethers = require('ethers')

const { bigNumberify } = ethers.utils

module.exports = async ({
  governor,
  lastApprovalTime,
  submissionTimeout,
  timestamp
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
    } catch (err) {
      console.error('Error executing submissions')
      console.error(err)
      return
    }

    console.info('Done calling executeSubmissions.')
  }
}
