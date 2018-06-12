// Configuration
const webPort = 3000;
const nodePort = 8080;


// Not edit if you dont know whats going on
const util = require('util')
const exec = require('child_process').exec;
const io = require('socket.io').listen(nodePort);
const fs = require('fs');
const os = require('os');
const sr = require('screenres');

// Express
const express = require('express');

const app = express();

// Get screen width and height
const [scrWidth, scrHeight] = sr.get();


// 4 numbers secret code generator. TODO: It is the best method?
const secret = (function(){

    let a = parseInt(Math.random()*9998+1);   // Maximum = 9999 when Math.random() = 1, never obtain 0 (then following code will fail)

    let b = (4-a.toString().length);
    return a*Math.pow(10,b);                // Multyply until obtain 4 numbers

})();

let connected = false;  // Security reasons. TODO: May not be the best.
let socketPaired = {
    screen : void 0 ,
    mobile : void 0 
};

// Get ip address from system to connect with mobile phone
let networks = os.networkInterfaces();
let mobileSocketId = 0;
let ipAddress = (function(){
        let networks = os.networkInterfaces();
        let ipAddress;
        Object.keys(networks).forEach(function(k){
            networks[k].forEach(function(l){
                if(l.internal === true || l.family === "IPv6"){
                    return;
                }else{
                    ipAddress = l.address;
                }
            });
        });
        // Look for wlan0
        
        return ipAddress;

    }
    )();

/**
 *  Socket connection. TODO: May have security leaks!!!
 */
io.on('connection', function(socket) {

    socket.on("getsecret", function(){
        console.log("Secret send to "+socket.id);
        if(!connected){
            socket.emit('code','{"code": "'+secret+'", "address": "http://'+ipAddress+':'+webPort+'"}');
        }else{
            socket.emit('err','{"text": "no autorizado"}');

        }    
    });
    

    socket.on("checksecret", function(_data){
        
        let data = JSON.parse(_data);
        mobileSocketId = socket.id;
        if(data.secret === secret){
            connected = true;
            console.log("Secret correct= "+_data);
            socket.emit("data", JSON.stringify({info: "loggin", logged:true}));
        }else{
            socket.emit("data", JSON.stringify({info: "loggin", logged:false}));
        }

    });

    socket.on("position", function(_data){
        if(socket.id === mobileSocketId){
            let data = JSON.parse(_data);
            console.log("Pos x = "+data.x+", y = "+data.y);
            moveMouse([data.x*scrWidth, data.y*scrHeight]);
        }

    });

    socket.on("click", function(_data){
        if(socket.id === mobileSocketId){
            
            console.log("Click");
            click();
        }

    });
});



/**
 *  Web server code.
 *
 *
 */

app.listen(webPort, function () {
  console.log('Web service listening on port '+webPort+'. Secret = '+secret);
});


app.get('/socket.js', function (req, res) {
    res.sendFile(__dirname + '/web/socket.js');
});

app.get('/configuration.js', function (req, res) {
    res.send(`
        const configuration = {
            webport : `+webPort+`,
            nodeport : `+nodePort+`
        }`);
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/web/mobile.html');
});

app.get('/welcome', function (req, res) {
    res.sendFile(__dirname + '/web/index.html');
});





/**
 *
 *  Exec functions: functions that are called from system.
 *
 *  To add new behaviours, you will need to change the following lines.
 *
 */
var child;


let google_chrome_open = exec("google-chrome http://localhost:"+webPort+"/welcome/",function(error,stdout,stderr){
    if(error !== null){
        console.error("Error al abrir google-chrome");
        exit;
    }
});

let moveMouse = function(pos){
    child = exec("xdotool mousemove "+pos[0]+" "+pos[1], function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });
};

let click = function(){
    child = exec("xdotool click 1", function (error, stdout, stderr) {
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });
};
/*

child = exec("xdotool mousemove 200 200", function (error, stdout, stderr) {
  console.log('stdout: ' + stdout);
  console.log('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }
});*/