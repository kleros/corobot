const ethers = require('ethers')
const alarm = require('../utils/alarm')
const { truncateETHAddress } = require('../utils/strings')

const { bigNumberify } = ethers.utils

const ALARM_THRESHOLD_SECONDS =
  process.env.ALARM_THRESHOLD_SECONDS || 3 * 24 * 60 * 60

module.exports = async ({
  governor,
  lastApprovalTime,
  timestamp,
  currentSessionNumber,
  chainName,
  chainId
}) => {
  // Did we pass ALARM_THRESHOLD_SECONDS?
  if (
    bigNumberify(timestamp)
      .sub(lastApprovalTime)
      .lte(bigNumberify(ALARM_THRESHOLD_SECONDS))
  )
    return

  // Did address SUBMITTER_ADDRESS submit a list
  // before 3 days since lastApprovalTime?
  const submittedListIndexes = await governor.getSubmittedLists(
    currentSessionNumber
  )
  if (submittedListIndexes.length === 0) {
    await alarm(
      `Governor Warning: ${truncateETHAddress(
        process.env.SUBMITTER_ADDRESS
      )} did not submit any lists.`,
      `no submissions by ${process.env.SUBMITTER_ADDRESS} found for the current session. \n Please visit ${process.env.UI_PATH} and submit a list ASAP!`
    )
    return
  }

  const submittedLists = await Promise.all(
    submittedListIndexes.map(i => governor.submissions(i.toString()))
  )

  if (
    !submittedLists
      .map(({ submitter }) => submitter)
      .includes(process.env.SUBMITTER_ADDRESS)
  )
    await alarm({
      subject: `Governor Warning: Someone submitted a list to governor but ${truncateETHAddress(
        process.env.SUBMITTER_ADDRESS
      )} did not.`,
      message: `no submissions by ${process.env.SUBMITTER_ADDRESS} found for the current session, but another address submitted a list. \n Please visit ${process.env.UI_PATH}, check the submission and submit a list ASAP!`,
      chainName,
      chainId
    })
}
