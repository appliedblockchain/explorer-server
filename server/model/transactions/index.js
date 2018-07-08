'use strict'
const { getTransaction } = require('./getTransaction')
const { getTransactions, setup, addContractInfo } = require('./getTransactions')

module.exports = {
  addContractInfo,
  getTransaction,
  getTransactions,
  setup
}
