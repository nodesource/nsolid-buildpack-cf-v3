'use strict'

// Get CF-related environment variables.

exports.DefaultConsoleServiceName = 'nsolid-console'
exports.getVcapApplication = getVcapApplication
exports.getVcapServices = getVcapServices
exports.getConsoleCredentials = getConsoleCredentials

const path = require('path')

const Program = path.basename(__filename)
const DefaultConsoleServiceName = exports.DefaultConsoleServiceName

// These won't change for the lifetime of an app, so go ahead and cache
const VcapApplication = getJsonEnvVar('VCAP_APPLICATION')
const VcapServices = getJsonEnvVar('VCAP_SERVICES')

// Return env var VCAP_APPLICATION, parsed.
function getVcapApplication () {
  return JSON.parse(JSON.stringify(VcapApplication))
}

// Return env var VCAP_SERVICES, parsed.
function getVcapServices () {
  return JSON.parse(JSON.stringify(VcapServices))
}

function getConsoleCredentials (consoleServiceName) {
  if (consoleServiceName == null) consoleServiceName = DefaultConsoleServiceName

  const result = getConsoleServiceCredentials(consoleServiceName)

  return JSON.parse(JSON.stringify(result))
}

// Get the console service credentials from VCAP_SERVICES
function getConsoleServiceCredentials (consoleServiceName) {
  const upServices = VcapServices['user-provided']
  if (upServices == null) return null

  for (let service of upServices) {
    if (service.name === consoleServiceName) return service.credentials
  }

  return null
}

// Return a JSON parsed env var (eg, VCAP_SERVICES etal)
function getJsonEnvVar (envVar) {
  const envVal = process.env[envVar]
  if (envVal == null) {
    error(`env var ${envVar} was unexpectedly not set, using {}`)
    return {}
  }

  try {
    return JSON.parse(envVal)
  } catch (err) {
    error(`env var ${envVar} was not valid JSON, using {}: ${envVal}`)
    return {}
  }
}

// Print an error message
function error (message) {
  console.error(`${Program}: ${message}`)
}
