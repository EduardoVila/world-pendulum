var SerialPort = require('serialport');
const ByteLength = require('@serialport/parser-byte-length')
const Readline = require('@serialport/parser-readline')

//Usando a UART_C do Colibri iMX6
 
var port = new SerialPort('/dev/ttyUSB0', { 
  baudRate: 115200
});
const parser = port.pipe(new Readline({ delimiter: '\r' }))

parser.on('data', function (data) {
  console.log('Data: ' + data);
});