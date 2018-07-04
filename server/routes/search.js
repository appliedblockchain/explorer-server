'use strict'
const Router = require('koa-router')
const validate = require('koa2-validation')
const Joi = require('joi')
const { isPrefixedHex, prefixHex } = require('@appliedblockchain/bdash')
const { getBlockOrTx } = require('../model/search.js')
const { isHash, strIsInt } = require('../utils')

/* GET /search */
const search = web3 => async (ctx) => {
  const query = ctx.query.q.trim()

  let result = null

  if (strIsInt(query)) {
    const number = parseInt(query, 10)
    const lastBlockNumber = await web3.eth.getBlockNumber()

    result = number <= lastBlockNumber
      ? { type: 'block', value: number }
      : null
  }

  if (isHash(query)) {
    const hash = isPrefixedHex(query) ? query : prefixHex(query)
    result = await getBlockOrTx(web3, hash)
  }

  ctx.body = {
    status: 'OK',
    data: { query, result }
  }
}


/* :: Web3 -> Router */
const createSearchRouter = (web3) => {
  const router = new Router()

  router.get(
    '/search',
    validate({
      query: Joi.object({
        q: Joi.string().required()
      })
    }),
    search(web3)
  )

  return router
}

module.exports = createSearchRouter
