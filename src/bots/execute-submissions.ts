import { ethers, Contract } from 'ethers'
import { NO_LIST_SUBMITTED } from '../utils/db-keys'
import { NO_DISPUTE } from '../utils/enums'
import { BigNumber } from 'ethers/utils'

const { bigNumberify } = ethers.utils

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
    console.info('Done calling executeSubmissions.')
  } catch (err) {
    console.error('Error executing submissions')
    console.error(err)
  }
}
