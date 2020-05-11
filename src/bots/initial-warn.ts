import { ethers, Contract } from 'ethers'
import alarm from '../utils/alarm'
import { NO_LIST_FIRST_HALF } from '../utils/db-keys'
import { BigNumber } from 'ethers/utils'

// Used to ensure addresses are in checksummed format.
const { getAddress } = ethers.utils

interface NoListSubmittedParams {
  governor: Contract,
  lastApprovalTime: BigNumber,
  timestamp: number,
  currentSessionNumber: BigNumber,
  chainName: string,
  submissionTimeout: BigNumber,
  chainId: number,
  signerAddress: string,
  db: Level
}

// Sends an email to every SUBMITTER if we entered a new
// period, requesting that an empty list be submitted.
export default async ({
  governor,
  lastApprovalTime,
  timestamp,
  currentSessionNumber,
  chainName,
  submissionTimeout,
  chainId,
  signerAddress,
  db
}: NoListSubmittedParams) => {
  try {
    const savedState = JSON.parse(await db.get(NO_LIST_FIRST_HALF))

    // Check if we already sent at least one alarm for this session.
    const { lastApprovalTime: savedLastApprovalTime } = savedState
    if (savedLastApprovalTime && Number(savedLastApprovalTime) === lastApprovalTime.toNumber())
      return // Already notified for this session

  } catch (err) {
    if (err.type !== 'NotFoundError') throw new Error(err)
  }

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

  await db.put(
    NO_LIST_FIRST_HALF,
    JSON.stringify({ lastApprovalTime: lastApprovalTime.toString() })
  )

  return
}
