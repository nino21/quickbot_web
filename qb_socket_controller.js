console.log("starting ...");

// Creates a websocket with socket.io
// Make sure to install socket.io: terminal, goto /var/lib/cloud9 and enter: npm install socket.io
// Installing this takes a few minutes; wait until the installation is complete

var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
var b = require('bonescript');

app.listen(8081);
// socket.io options go here
io.set('log level', 2);   // reduce logging - set 1 for warn, 2 for info, 3 for debug
io.set('browser client minification', true);  // send minified client
io.set('browser client etag', true);  // apply etag caching logic based on version number

console.log('Server running on: http://' + getIPAddress() + ':8081');



// Motor pins: (dir1_pin, dir2_pin, pwd_pin)
var RIGHT_MOTOR_PINS  = ["P8_12", "P8_10", "P9_14"];
var LEFT_MOTOR_PINS   = ["P8_14", "P8_16", "P9_16"];

b.pinMode(RIGHT_MOTOR_PINS[0], b.OUTPUT);
b.pinMode(RIGHT_MOTOR_PINS[1], b.OUTPUT);
b.pinMode(RIGHT_MOTOR_PINS[2], b.ANALOG_OUTPUT);
b.pinMode(LEFT_MOTOR_PINS[0], b.OUTPUT);
b.pinMode(LEFT_MOTOR_PINS[1], b.OUTPUT);
b.pinMode(LEFT_MOTOR_PINS[2], b.ANALOG_OUTPUT);

// IR sensors (clock-wise, starting with the rear left sensor):
// rear-left, front-left, front, front-right, rear-right
var IR_PINS = ['P9_38', 'P9_40', 'P9_36', 'P9_35', 'P9_33'];

// Wheel encoder sensors: (left, right)
var ENC_PINS = ['P9_39', 'P9_37'];



function handler (req, res) {
  if (req.url == "/favicon.ico"){   // handle requests for favico.ico
  res.writeHead(200, {'Content-Type': 'image/x-icon'} );
  res.end();
  console.log('favicon requested');
  return;
  }
  fs.readFile('HtmlQuickbotController.html',    // load html file
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  // listen to sockets and write analog values to LED's
  socket.on('rightWheel', function (data) {
      runMotor('RIGHT', data);
//    console.log('Red: ' + data);
  });
  socket.on('leftWheel', function (data) {
      runMotor('LEFT', data);
//    console.log('Green: ' + data);
  });
});

// Run the given motor at the given speed
// params
// side: The motor to run ('RIGHT' or 'LEFT')
// speed: The percentage of power, integer value from 0(stop) to 100(full speed)
function runMotor(side, speed) {
    var dir1_pin = "";
    var dir2_pin = "";
    var pwm_pin = "";
    if (side == 'RIGHT') {
        dir1_pin = RIGHT_MOTOR_PINS[0];
        dir2_pin = RIGHT_MOTOR_PINS[1];
        pwm_pin = RIGHT_MOTOR_PINS[2];
    } else if(side == 'LEFT') {
        dir1_pin = LEFT_MOTOR_PINS[0];
        dir2_pin = LEFT_MOTOR_PINS[1];
        pwm_pin = LEFT_MOTOR_PINS[2];
    } else {
        console.log("invalid value for motor side: " + side);
        return;
    }
    
    if (speed > 100) {
        speed = 100;
    } else if(speed < -100) {
        speed = -100;
    }

    if (speed > 0) {
        b.digitalWrite(dir1_pin, b.LOW);
        b.digitalWrite(dir2_pin, b.HIGH);
        b.analogWrite(pwm_pin, Math.abs(speed) / 100);
    } else if(speed < 0) {
        b.digitalWrite(dir1_pin, b.HIGH);
        b.digitalWrite(dir2_pin, b.LOW);
        b.analogWrite(pwm_pin, Math.abs(speed) / 100);
    } else {
        b.digitalWrite(dir1_pin, b.LOW);
        b.digitalWrite(dir2_pin, b.LOW);
        b.analogWrite(pwm_pin, 0);
    }
}




function printJSON(x) {
    console.log(JSON.stringify(x));
}

// Get server IP address on LAN
function getIPAddress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }
  return '0.0.0.0';
}