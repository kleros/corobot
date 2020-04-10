import { ethers, Contract } from 'ethers'
import { NO_LIST_SUBMITTED } from '../utils/db-keys'
import { BigNumber } from 'ethers/utils'
import { JsonRpcProvider } from 'ethers/providers'

// Used to ensure addresses are in checksummed format.
const { getAddress, bigNumberify } = ethers.utils

interface SubmitListParams {
  governor: Contract,
  lastApprovalTime: BigNumber,
  submissionTimeout: BigNumber,
  currentSessionNumber: BigNumber,
  db: Level,
  signerAddress: string,
  submissionDeposit: BigNumber,
  provider: JsonRpcProvider
}

// Submits an empty list of transactions if all conditions
// below are met:
// - We passed LIST_SUBMISSION_THRESHOLD_SECONDS;
// - The session is not over;
// - None lists were submitted by SUBMITTER_ADDRESSES;
// - The alarm is not disarmed for this session.
export default async ({
  governor,
  lastApprovalTime,
  submissionTimeout,
  currentSessionNumber,
  db,
  signerAddress,
  submissionDeposit,
  provider
}: SubmitListParams) => {
  // Check if someone disarmed the alarm for this session
  let disarmed
  try {
    const savedState = JSON.parse(await db.get(NO_LIST_SUBMITTED))
    disarmed =
      savedState &&
      savedState.disarmed &&
      Number(savedState.currentSessionNumber) ===
        currentSessionNumber.toNumber()
  } catch (err) {
    if (err.type !== 'NotFoundError') throw new Error(err)
  }
  if (disarmed) return

  const sessionEnd = lastApprovalTime.add(submissionTimeout).toNumber()

  // This bot will submit an empty list if we are one hour or less
  // from the end of the session.
  // Otherwise, wait.
  const listSubmissionThreshold = process.env.LIST_SUBMISSION_THRESHOLD_SECONDS
    ? Number(process.env.LIST_SUBMISSION_THRESHOLD_SECONDS)
    : 60 * 60 // 1 hour

  if (Date.now() / 1000 < sessionEnd - listSubmissionThreshold) return

  if (Date.now() / 1000 > sessionEnd) return // Wait for the next session.

  console.info('Within list submission period')

  let submittedListIndexes
  try {
    submittedListIndexes = await governor.getSubmittedLists(
      currentSessionNumber
    )
  } catch (err) {
    console.error(`Error getting submitted lists or submission deposit value.`)
    throw err
  }

  // Check if one of the submitters sent a list.
  let submittedLists
  try {
    submittedLists = await Promise.all(
      submittedListIndexes.map((i: number) => governor.submissions(i.toString()))
    )
  } catch (err) {
    console.error(
      `Error fetching submissions. Indexes ${submittedListIndexes.map((i: number) =>
        i.toString()
      )}`
    )
    throw err
  }

  const submitterAddresses = JSON.parse(
    process.env.SUBMITTER_ADDRESSES as string
  ).map((submitter: string) => getAddress(submitter))
  submitterAddresses.push(signerAddress)

  if (
    submittedLists
      .map(({ submitter }) => getAddress(submitter))
      .some(submitter => submitterAddresses.includes(submitter))
  ) {
    console.info('One of the submitters made a submission.')
    return
  }

  console.info(
    'Alarm is not disarmed, submission threshold passed and none of SUBMITTER_ADDRESSES sent a list.'
  )
  console.info('Submitting empty list...')

  const suggestedGasPrice = await provider.getGasPrice()
  await governor.submitList([], [], [], [], '', {
    value: submissionDeposit,
    gasPrice: bigNumberify(suggestedGasPrice).mul(bigNumberify(2))
  })

  console.info('Done submitting list.')
}