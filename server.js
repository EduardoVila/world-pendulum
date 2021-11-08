// setup basic express server

const express = require('express')
const app = express()
const fs = require('fs')
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const cors = require('cors')
const Auth = require('./auth.js')
const bodyParser = require('body-parser') 
const jsonexport = require('jsonexport')

const Connection = require('./serial/connection')

// end setup basic express server

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public/'))
app.get('/', cors(), (req, res, next) => {
  const data = fs.readFileSync(__dirname + '/public/index.html', 'utf8')
  res.send(data)
})

app.post('/export', cors(), function(req, res, next) {
  const input = []

  for (const obj in req.body) {
    input.push(req.body[obj])
   }

  jsonexport(input,function(err, csv){ 
    if (err) return console.log(err);

    res.set({"Content-Disposition":"attachment; filename=\"dados.csv\""})
    res.send(csv)
  })
})

// global variables

SECRET = 'ee28a84fc9efd0d3940a91414f092c06'
PORT = 8080
SSI_ADDRESS = 'relle.ufsc.br:8080'
LAB_ID = 28

// end global variables

const formatted_data = data => {
  splitted_data = data.split(' ')

  return {
    number: splitted_data[0],
    period: splitted_data[1],
    gravity: splitted_data[2],
    velocity: splitted_data[3],
    temperature: splitted_data[4]
  }
}

// with a new connection

io.on('connection', function(socket) {
  const auth = new Auth(SSI_ADDRESS, SECRET, LAB_ID)

  const experimentCallback = (state, data) => {
    switch (state) {
      case 'running':
        switch (data) {
          case 'DAT':
            socket.emit('experiment_status', 'started')
            break
          case 'STROK':
            break
          case  'END':
            socket.emit('experiment_data', 'ended')
            break
          default:
            socket.emit('experiment_data', formatted_data(data))
            break
        }
        break
      case 'configured':
        socket.emit('experiment_status', 'configured')
        break
      case 'stoped':
        socket.emit('experiment_status', 'stoped')
        break
      default:
        break
    }
  }

  // starting connection class
  const connection = new Connection(experimentCallback)

  socket.on('new connection', data => {
    console.log('new connection ', data, new Date())
    connection.open()

    if (typeof(data.pass) === 'undefined') {
      socket.emit('err', {
        code: 402,
        message: 'Missing authentication token.'
      })

      console.log('erro 402')
      return
    }

    const ev = auth.Authorize(data.pass)

    ev.on('not authorized', () => {
      socket.emit('err', {
        code: 403,
        message: 'Permission denied. Note: Resource is using external scheduling system.'
      })

      console.log('not authorized')
      return
    })

    // If connection is autorized 
    ev.on("authorized", () => {    
      interval = true
    })
  })

  socket.on('experiment_config', data => {
    connection.configExperiment(data.distance, data.oscillations)
  })

  socket.on('experiment_start', () => {
    connection.startExperiment()
  })

  socket.on('light_bulb', data => {
    if (data) {
      connection.turnLightBulbOn()
    } else {
      connection.turnLightBulbOff()
    }
  })

  //End of connection
  socket.on('disconnect', () => {
    connection.turnLightBulbOff()

    if (!auth.isAuthorized()) {
      socket.emit('err', {
        code: 403,
        message: 'Permission denied. Note: Resource is using external scheduling system.'
      })

      console.log('erro 403')
      return
    }

    console.log('disconnected', new Date())
  })
})

server.listen(PORT, () => {
  console.log('Server listening at port %d', PORT)
  console.log(new Date())
})
