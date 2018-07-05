'use strict'
const { isNil, first, pickBy, isString, get } = require('lodash')
const abiDecoder = require('abi-decoder')
const getNetworkConfig = require('./getNetworkConfig')
const { standardLogHandler } = require('./standardLogHandler')

/* :: (object, string) -> ?object */
const getContractInfo = (contracts, _address) => {
  const address = _address.toLowerCase()
  const hasAddress = ({ deployments = [] }) =>
    deployments.some(deployment => address === deployment.address.toLowerCase())
  const contract = pickBy(contracts, hasAddress)

  return first(Object.values(contract))
}


/**
 [1]. Check if the transaction is for a known contract.
 [2]. @TODO: Remove this after refactoring the client. `toName` field can be part
 of `to` field.
 */

/* :: object -> object */
const standardTxHandler = async ({ networkConfigPath, tx, web3 }) => {
  const { contracts } = await getNetworkConfig(networkConfigPath)
  const contractInfo = getContractInfo(contracts, tx.to || tx.creates) /* [1] */

  if (isNil(contractInfo)) {
    return tx
  }

  let method
  let params

  abiDecoder.addABI(contractInfo.abi)
  const decodedMethod = abiDecoder.decodeMethod(tx.input)

  /** Handle contract creation. i.e tx.to is empty */
  if (isString(tx.to)) {
    method = decodedMethod.method
    params = decodedMethod.params
  } else {
    method = contractInfo.name
    params = get(decodedMethod, 'params')
  }

  const logs = await standardLogHandler({
    tx,
    web3,
    abi: contractInfo.abi
  })
  const txWithExtraInfo = {
    ...tx,
    logs,
    method,
    params,
    enhanced: true, /* [2] */
    toName: contractInfo.name /* [2] */
  }

  return txWithExtraInfo
}

module.exports = {
  getNetworkConfig,
  getContractInfo,
  standardTxHandler
}
