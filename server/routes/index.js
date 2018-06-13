'use strict'
const Router = require('koa-router')
const createBlockRouter = require('./blocks')
const createTxRouter = require('./transaction')

/** Routes */

/* :: string -> Router */
const createAPIRoutes = (prefix, web3, networkConfigPath) => {
  const config = prefix ? { prefix } : {}
  const api = new Router(config)
  const blocks = createBlockRouter(web3)
  const transactions = createTxRouter(web3, networkConfigPath)

  api
    .use(blocks.routes())
    .use(transactions.routes())

  return api
}

module.exports = createAPIRoutes
