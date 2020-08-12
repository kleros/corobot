import { ethers } from 'ethers'
import * as express from 'express'
import * as cors from 'cors'

import validateSchema from '../schemas/validation'
import { NO_LIST_SUBMITTED } from '../utils/db-keys'

const router = express.Router()

const buildRouter = (db: Level) => {
  router.all('*', cors())
  router.post('/disarm', cors(), validateSchema('disarm'), async (req, res) => {
    try {
      const { signature, signerAddr: claimedSignerAddr } = req.body
      const message = `Kleros Alarm Auth: My address is ${claimedSignerAddr}.`
      const signerAddr = ethers.utils.getAddress(ethers.utils.verifyMessage(message, signature))

      if (signerAddr !== ethers.utils.getAddress(claimedSignerAddr)) {
        res.status(401).send({
          errors: [`Claimed address does not match recovered address`],
          status: 'failed'
        })
        return
      }

      const submitterAddresses = JSON.parse(process.env.WHITELISTED_ADDRESSES as string)
      if (!submitterAddresses.includes(signerAddr)) {
        res.status(401).send({
          errors: [`Address not authorized to disarm the alarm.`],
          status: 'failed'
        })
        return
      }

      const savedState = JSON.parse(await db.get(NO_LIST_SUBMITTED))
      savedState.disarmed = true
      await db.put(NO_LIST_SUBMITTED, JSON.stringify(savedState))
      res.status(200).send({
        message: `Alarm disarmed for this period.`,
        status: 'success'
      })
    } catch (err) {
      if (err.type === 'NotFoundError')
        res.status(200).send({
          message: `No session to disarm.`,
          status: 'success'
        })
      else
        res.status(500).send({
          errors: [err.message],
          status: 'failed'
        })
    }
  })

  return router
}

export default buildRouter
