var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var url = require('url');
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED = new Gpio(21, 'out'); //use GPIO pin 4 as output
//var pushButton = new Gpio(17, 'in', 'both'); //use GPIO pin 17 as input, and 'both' button presses, and releases should be handled

http.listen(8080); //listen to port 8080

function renderHTML(path, response) {
  fs.readFile(_dirname + path, function(error, data) {
      if (error) {
          response.writeHead(404);
          response.write('File not found!');
      } else {
          response.write(data);
      }
      response.end();
  });
}

function handler (req, res) { //create server
  res.writeHead(200, {'Content-Type': 'text/html'});

      var path = url.parse(req.url).pathname;
      switch (path) {
          case '/':
              renderHTML('/views/index.html', res);
              break;
          case '/login':
              renderHTML('/views/scheduler.html', res);
              break;
          default:
              res.writeHead(404);
              res.write('Route not defined');
              res.end();
      }
}

io.sockets.on('connection', function (socket) {// WebSocket Connection
  var lightvalue = 0; //static variable for current status
/*   pushButton.watch(function (err, value) { //Watch for hardware interrupts on pushButton
    if (err) { //if an error
      console.error('There was an error', err); //output error message to console
      return;
    }
    lightvalue = value;
    socket.emit('light', lightvalue); //send button status to client
  }); */
  socket.on('light', function(data) { //get light switch status from client
    lightvalue = data;
    if (lightvalue != LED.readSync()) { //only change LED if status has changed
      LED.writeSync(lightvalue); //turn LED on or off
    }
  });
});

process.on('SIGINT', function () { //on ctrl+c
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  //pushButton.unexport(); // Unexport Button GPIO to free resources
  process.exit(); //exit completely
});