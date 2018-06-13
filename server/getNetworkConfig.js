'use strict'
const fs = require('fs-extra')

/* :: string -> object */
const getNetworkConfig = async (filePath) => {
  let config

  try {
    config = await fs.readJson(filePath)
  } catch (e) {
    config = {
      contracts: {},
      addressBook: {}
    }
  }

  return config
}

module.exports = getNetworkConfig
