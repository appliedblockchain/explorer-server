'use strict'
const Router = require('koa-router')
const createBlockRouter = require('./blocks')
const createTxRouter = require('./transaction')
const createSearchRouter = require('./search')
const createNetworkRouter = require('./network')

/** Routes */

/* :: (string, object) -> Router */
const createAPIRoutes = (web3, opts) => {
  const config = opts.prefix ? { prefix: opts.prefix } : {}
  const api = new Router(config)

  const blocks = createBlockRouter(web3)
  const transactions = createTxRouter(web3, opts)
  const search = createSearchRouter(web3)
  const network = createNetworkRouter(web3)

  api
    .use(blocks.routes())
    .use(transactions.routes())
    .use(search.routes())
    .use(network.routes())

  return api
}

module.exports = createAPIRoutes
