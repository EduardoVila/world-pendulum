const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const { id, portId, ...serial_config } = require('./config')
const commands = require('./commands')
const serial = new SerialPort(portId, serial_config)
const parser = serial.pipe(new Readline({ delimiter: '\r' }))

// global variables

STATE = 'closed'

// end global variables

class Connection {
  constructor(callback) {
    this.checkExperimentState(callback)
  }

  // methods

  async open() {
    return new Promise(resolve => {
      setTimeout(() => {
        STATE = 'opened'

        resolve(true)
      }, 1000)
    })  
  }

  turnLightBulbOn() {
    if ( STATE == 'closed' ) { return false }

    this.writeOnSerialPort(commands.lightBulbOn())

    return true
  }

  turnLightBulbOff() {
    if ( STATE == 'closed' ) { return false }

    this.writeOnSerialPort(commands.lightBulbOff())

    return true
  }

  startExperiment() {
    if (STATE != 'configured') return false

    this.writeOnSerialPort(commands.start())

    return true
  }

  configExperiment(distance, oscillations) {
    if (STATE != 'stoped') return false

    this.writeOnSerialPort(commands.setConfig(distance, oscillations))

    return true
  }

  getExperimentState() {
    return STATE
  }

  writeOnSerialPort(command) {
    serial.write(Buffer.from(`${command}\r`, 'ascii'))
  }

  formattedString(string) {
    return string.toString().replace(/\s+/g,' ').trim()
  }

  checkExperimentState(callback) {
    parser.on('data', data => {
      const current_data = this.formattedString(data)

      switch (current_data) {
        case `${id} STOPED`:
          STATE = 'stoped'
          break
        case `${id} CONFIGURED`:
          STATE = 'configured'
          break
        case 'STROK':
          STATE = 'running'
          break
        case `${id} RESETED`:
          STATE = 'reseted'
          this.writeOnSerialPort(commands.stop())
          break
        case 'STP':
          STATE = 'stopping'
          break
        default:
          break
      }

      callback(STATE, current_data)
    })
  }

  //end methods
}

module.exports = Connection
