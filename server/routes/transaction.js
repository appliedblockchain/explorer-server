'use strict'
const Router = require('koa-router')
const validate = require('koa2-validation')
const Joi = require('joi')
const model = require('../model/transactions')

/* GET /api/v1/transactions */
const getTransactions = async (ctx) => {
  const { limit } = ctx.query
  const transactions = await model.getTransactions(limit)

  ctx.body = {
    status: 'OK',
    data: transactions
  }
}

/* GET /api/v1/transactions/:txhash */
const getTrasaction = (web3, opts) => async (ctx) => {
  const { txhash } = ctx.params
  const transaction = await model.getTransaction(web3, txhash, opts)

  ctx.body = {
    status: 'OK',
    data: transaction
  }
}


/* :: Web3 -> Router */
const createTxRouter = (web3, opts) => {
  model.setup(web3)

  const router = new Router()

  router.get(
    '/transactions',
    validate({
      query: Joi.object({
        limit: Joi.number().positive().integer()
      })
    }),
    getTransactions
  )

  router.get(
    '/transactions/:txhash',
    validate({
      params: Joi.object({
        txhash: Joi.string().hex().length(64).required()
      })
    }),
    getTrasaction(web3, opts)
  )

  return router
}

module.exports = createTxRouter
