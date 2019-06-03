'use strict'
const Router = require('koa-router')
const validate = require('koa2-validation')
const Joi = require('joi')
const { isEmpty } = require('lodash')
const model = require('../model/blocks')
const { addContractInfo } = require('../model/transactions')

/* GET /api/v1/blocks */
const getBlocks = web3 => (ctx) => {
  const { limit } = ctx.query
  const blocks = model.getBlocks(web3, limit)

  ctx.body = {
    status: 'OK',
    data: blocks,
    isSynching: isEmpty(blocks)
  }
}

/* GET /api/v1/blocks/:number */
const getBlock = (web3, options) => async (ctx) => {
  const blockNumber = parseInt(ctx.params.number, 10)
  const block = await web3.eth.getBlock(blockNumber, true)

  if (!block) {
    ctx.throw(404, 'Block not found')
  }

  await addContractInfo(block.transactions, options)

  ctx.body = {
    status: 'OK',
    data: block
  }
}


/* :: Web3 -> Router */
const createBlockRouter = (web3, options) => {
  model.setup(web3)

  const router = new Router()

  router.get(
    '/blocks',
    validate({
      query: Joi.object({
        limit: Joi.number().positive().integer()
      })
    }),
    getBlocks(web3)
  )

  router.get(
    '/blocks/:number',
    validate({
      params: Joi.object({
        number: Joi.number().integer().required()
      })
    }),
    getBlock(web3, options)
  )

  return router
}

module.exports = createBlockRouter
