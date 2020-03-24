const express = require('express')
const cors = require('cors')
const { NO_LIST_SUBMITTED } = require('../utils/db-keys')

const router = express.Router()

const buildRouter = db => {
  router.post('/disarm', cors(), async (_, res) => {
    try {
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
          message: `No session to disarm.`
        })
      else
        res.status(500).send({
          message: `Error, please contact administrators`,
          error: err.message,
          status: 'error'
        })
    }
  })

  router.all('*', cors())

  return router
}

module.exports = buildRouter
