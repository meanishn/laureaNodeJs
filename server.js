//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');
var mongo = require('mongodb').MongoClient;
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var app = express();
var server = http.createServer(app);
var io = socketio.listen(server);

app.use(express.static(path.resolve(__dirname, 'client')));
app.set('view engine', 'ejs');
var host = "mongodb://"+process.env.IP+":27017/chat";

mongo.connect(host, function(err, db){
    if(err) {
      throw "cannot connect to mongo Instance\n"+err;
    }
    console.log("Mongo connection successful");
    var collection = db.collection('messages');
    app.get("/chat", function (req, res){
        collection.find().limit(100).sort({_id: 1}).toArray(function (err, response){
          if (err) throw err;
          
          res.render("chat", {
            user: "anish",
            chats: response
          });
          //socket.emit("output", response);
      
        });
    })
    

    io.on("connection", function(socket){
      console.log("connection to socket");
      console.log(io.sockets.clients().length);
     
      function sendStatus(msg) {
        socket.emit("statusMessage", msg);
      }
      
      socket.on("input", function (data){
        
        var name = data.name,
            message = data.message,
            regex = /^\s*$/;
            
          if(regex.test(name) || regex.test(message)){
            sendStatus("Name and message is required.");
          } else {
            //add to the database
            
            collection.insert({name: name, message: message}, function(){
              console.log(data);
              
              console.log("data inserted");
              io.sockets.emit("output", [data]);
              //process.exit();
              sendStatus({
                message: "message sent",
                clear: true
              });
            });
          }
            
            
      });
      socket.on("disconnect", function (){
        console.log("disconnected");
      });
    });
    
  });
  



//app.listen(process.env.PORT);
server.listen(process.env.PORT, process.env.IP, function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
