'use strict'
const path = require('path')
const Koa = require('koa')
const errorHandler = require('./server/middlewares/errorHandler')
const notFoundHandler = require('./server/middlewares/notFoundHandler')
const createAPIRoutes = require('./server/routes')
const createWeb3 = require('./server/createWeb3')

const defaultOpts = {
  prefix: false,
  ethereumJsonRPC: 'http://localhost:8546',
  networkConfigPath: path.resolve('./config.json'),
  useStandardHandler: true,
  txHandler: null
}

/* :: (?object) -> Koa */
const createServer = (opts = {}) => {
  const options = { ...defaultOpts, ...opts }
  const app = new Koa()
  const web3 = createWeb3(options.ethereumJsonRPC)
  const api = createAPIRoutes(web3, options)

  app
    .use(errorHandler)
    .use(notFoundHandler)
    .use(api.routes())
    .use(api.allowedMethods())

  return app
}

module.exports = {
  createServer
}
