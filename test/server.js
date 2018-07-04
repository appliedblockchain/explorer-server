'use strict'
const path = require('path')
const { createServer } = require('..')

const app = createServer({
  prefix: '/api/v1',
  ethereumJsonRPC: 'http://localhost:8545',
  networkConfigPath: path.resolve(__dirname, './fixtures/config.json')
})

app.listen(3001, () => {
  console.log('Listening on port 3001...')
})
