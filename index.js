'use strict'
const path = require('path')
const Koa = require('koa')
const errorHandler = require('./server/middlewares/errorHandler')
const notFoundHandler = require('./server/middlewares/notFoundHandler')
const createAPIRoutes = require('./server/routes')
const createWeb3 = require('./server/createWeb3')

/* :: (?object) -> Koa */
const createServer = ({
  prefix = false,
  ethereumJsonRPC = 'http://localhost:8546',
  networkConfigPath = path.resolve('./config.json')
} = {}) => {
  const app = new Koa()
  const web3 = createWeb3(ethereumJsonRPC)
  const api = createAPIRoutes(prefix, web3, networkConfigPath)

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
