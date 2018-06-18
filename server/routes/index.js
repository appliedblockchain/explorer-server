'use strict'
const Router = require('koa-router')
const createBlockRouter = require('./blocks')
const createTxRouter = require('./transaction')

/** Routes */

/* :: (string, object) -> Router */
const createAPIRoutes = (web3, opts) => {
  const config = opts.prefix ? { prefix: opts.prefix } : {}
  const api = new Router(config)

  const blocks = createBlockRouter(web3)
  const transactions = createTxRouter(web3, opts)

  api
    .use(blocks.routes())
    .use(transactions.routes())

  return api
}

module.exports = createAPIRoutes
