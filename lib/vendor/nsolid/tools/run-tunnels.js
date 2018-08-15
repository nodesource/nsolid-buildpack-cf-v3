'use strict'

// Run tunnels for zmq from agent to console

const path = require('path')
const childProcess = require('child_process')

const cfEnv = require('./cf-env')

const Program = path.basename(__filename)

const ConsoleServiceName = cfEnv.DefaultConsoleServiceName
const VcapApplication = cfEnv.getVcapApplication()

log('determining tunnels that should be set up')

// extract some values
const VcapAppName = VcapApplication.application_name
const VcapSpaceName = VcapApplication.space_name

if (VcapAppName == null) {
  error('expecting VCAP_APPLICATION to have application_name property')
  error('tunnels will not be set up')
  process.exit(1)
}

if (VcapSpaceName == null) {
  error('expecting VCAP_APPLICATION to have space_name property')
  error('tunnels will not be set up')
  process.exit(1)
}

// get the console credentials
const consoleCredentials = cfEnv.getConsoleCredentials(ConsoleServiceName)
if (consoleCredentials == null) {
  error(`expecting a bound user-provided service named ${ConsoleServiceName}`)
  error('tunnels will not be set up')
  process.exit(1)
}

// check the tunnel type, if any
if (consoleCredentials.tunnel === 'cf-ssh') {
  runTunnelCfSsh(consoleCredentials)
} else {
  log('no "tunnel" property, not using tunnels')
  process.exit(0)
}

// run the cf ssh tunnel
function runTunnelCfSsh (consoleCredentials) {
  // get the consoleApp property
  const consoleApp = consoleCredentials['consoleApp']
  if (consoleApp == null) {
    error(`expecting console service ${ConsoleServiceName} to have property consoleApp`)
    process.exit(1)
  }

  // check credentials for all required properties
  const requiredKeys = 'user password cfapi org space app'.split(' ')
  let someMissing = false
  for (let requiredKey of requiredKeys) {
    if (consoleApp[requiredKey] == null) {
      someMissing = true
      error(`expecting console service ${ConsoleServiceName} to have property ${requiredKey}`)
    }
  }

  if (someMissing) {
    error('tunnels cannot be set up')
    process.exit(1)
  }

  // check to see if target of the tunnel is ourself!
  if (VcapAppName === consoleApp.app && VcapSpaceName === consoleApp.space) {
    log('looks like the app would be tunnelling to itself')
    log('tunnels will not be set up')
    process.exit(0)
  }

  loginAndTunnel(consoleCredentials)
}

function loginAndTunnel (consoleCredentials) {
  login(consoleCredentials, onLogin)

  function onLogin (err) {
    if (err) {
      error(`error logging in: ${err.message}`)
      error('tunnels cannot be set up')
      process.exit(1)
    }

    log('logged into cf')

    // start those tunnels!
    startTunnels(consoleCredentials, [9001, 9002, 9003], onStartTunnels)
  }

  function onStartTunnels (err) {
    if (err) {
      error(`error running tunnels: ${err.message}`)
    } else {
      error('tunneller stopped for unknown reason')
    }

    error('restarting in a few seconds')

    setTimeout(() => loginAndTunnel(consoleCredentials), 5000)
  }
}

// Log into specified CF installation.
function login (consoleCredentials, cb) {
  // cf login --skip-ssl-validation -a https://api.v3.pcfdev.io -o cfdev-org -s cfdev-space -u user -p pass
  const consoleApp = consoleCredentials['consoleApp']

  log('logging into cf')

  const args = [
    'login', '--skip-ssl-validation',
    '-a', consoleApp.cfapi,
    '-o', consoleApp.org,
    '-s', consoleApp.space,
    '-u', consoleApp.user,
    '-p', consoleApp.password
  ]

  const opts = {
    stdio: 'inherit'
  }

  runCommand('.nsolid-bin/cf', args, opts, (err, code, signal) => {
    if (err) return cb(err)
    if (signal) return cb(new Error(`signal received: ${signal}`))
    if (code !== 0) return cb(new Error(`process returned ${code}`))

    cb(null)
  })
}

// Start new tunnels to specified app, on specified ports
function startTunnels (consoleCredentials, ports, cb) {
  // cf ssh nsolid-console -T -L 9001:localhost:9001 -L 9002:localhost:9002 -L 9003:localhost:9003
  const consoleApp = consoleCredentials['consoleApp']

  log('starting tunnels')

  const args = [
    'ssh', consoleApp.app,
    '--disable-pseudo-tty',
    '--skip-host-validation',
    '--skip-remote-execution'
  ]

  for (let port of ports) {
    args.push('-L')
    args.push(`${port}:localhost:${port}`)
  }

  const opts = {
    stdio: 'ignore'
  }

  runCommand('.nsolid-bin/cf', args, opts, (err, code, signal) => {
    if (err) return cb(err)
    if (signal) return cb(new Error(`signal received: ${signal}`))
    if (code !== 0) return cb(new Error(`process returned ${code}`))

    cb(null)
  })
}

// Run a command.
function runCommand (cmd, args, opts, cb) {
  // const cmdPrint = `${cmd} ${args.join(' ')}`
  // log(`running command: ${cmdPrint}`)

  const process = childProcess.spawn(cmd, args, opts)

  process.on('exit', (code, signal) => {
    if (cb == null) return
    cb(null, code, signal)
    cb = null
  })

  process.on('error', (err) => {
    if (cb == null) return
    cb(err)
    cb = null
  })
}

// Print a message to stdout
function log (message) {
  console.log(`${Program}: ${message}`)
}

// Print a message to stderr
function error (message) {
  console.error(`${Program}: ${message}`)
}
