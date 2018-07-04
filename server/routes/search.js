'use strict'
const Router = require('koa-router')
const validate = require('koa2-validation')
const Joi = require('joi')
const { isString } = require('lodash')
const { isPrefixedHex, isUnprefixedHex, prefixHex } = require('@appliedblockchain/bdash')
const { getBlockOrTx } = require('../model/search.js')

/* any -> boolean */
const isHash = val => {
  if (!isString(val)) {
    return false
  }

  switch (val.length) {
    case 64:
      return isUnprefixedHex(val)
    case 66:
      return isPrefixedHex(val)
    default:
      return false
  }
}

/* string -> boolean */
const strIsInt = str => {
  const p = parseInt(str, 10)

  return !Number.isNaN(p) && String(p).length === str.length
}

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
