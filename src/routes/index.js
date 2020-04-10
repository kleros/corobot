const express = require('express')
const cors = require('cors')
const ethers = require('ethers')

const { NO_LIST_SUBMITTED } = require('../utils/db-keys')
const validateSchema = require('../schemas/validation')

const router = express.Router()

const buildRouter = db => {
  router.all('*', cors())
  router.post('/disarm', cors(), validateSchema('disarm'), async (req, res) => {
    try {
      const { signature, signerAddr: claimedSignerAddr } = req.body
      const message = `Kleros Alarm Auth: My address is ${claimedSignerAddr}.`
      const signerAddr = ethers.utils.verifyMessage(message, signature)

      if (signerAddr !== claimedSignerAddr) {
        res.status(401).send({
          errors: [`Claimed address does not match recovered address`],
          status: 'failed'
        })
        return
      }

      const submitterAddresses = JSON.parse(process.env.SUBMITTER_ADDRESSES)
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

module.exports = buildRouter
