import { ethers, Contract } from 'ethers'
import { NO_LIST_SUBMITTED } from '../utils/db-keys'
import alarm from '../utils/alarm'
import { NO_DISPUTE } from '../utils/enums'
import { BigNumber } from 'ethers/utils'

const { bigNumberify, getAddress } = ethers.utils

interface PassPeriodParams {
  governor: Contract,
  lastApprovalTime: BigNumber,
  submissionTimeout: BigNumber,
  currentSessionNumber: BigNumber,
  timestamp: number,
  db: Level,
  chainName: string,
  chainId: number,
  signerAddress: string
}

// If the session is over, calls executeSubmissions to start
// a new session.
export default async ({
  governor,
  lastApprovalTime,
  submissionTimeout,
  currentSessionNumber,
  timestamp,
  db,
  chainName,
  chainId,
  signerAddress
}: PassPeriodParams) => {
  const session = await governor.sessions(currentSessionNumber)

  // Are we still in the submission period?
  if (
    bigNumberify(timestamp)
      .sub(lastApprovalTime)
      .lte(submissionTimeout.add(session.durationOffset))
  )
    return

  // Submission period is over. Was there a dispute in the last session?
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
    const submitterAddresses = JSON.parse(
      process.env.WHITELISTED_ADDRESSES as string
    ).map((submitter: string) => getAddress(submitter))
    submitterAddresses.push(signerAddress)

    await alarm({
      emails: JSON.parse(process.env.SUBMITTERS as string),
      subject: `New Period: Please submit a list.`,
      message: `A new session started on the Kleros Governor.
      <br>
      <br>Please visit <a href="${
        process.env.GOVERNOR_URL
      }">the governor UI</a> to submit a list if no one did it yet.
      <br>
      <br>The submitters are:${submitterAddresses.map(
        (submitterAddress: string) => `<br>${submitterAddress}`
      )}`,
      chainName,
      chainId,
      secondary: `To disable the alarm for this session, click <a href="${process.env.BOT_URL}">here</a>`,
      templateId: process.env.REMINDER_TEMPLATE_ID
    })

    console.info('Done calling executeSubmissions.')
  } catch (err) {
    console.error('Error executing submissions')
    console.error(err)
  }
}
