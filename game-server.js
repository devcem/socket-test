const WebSocket = require('ws');
const shellExec   = require('shell-exec');

let ws   = false;
let http = false;
let app  = false;

var isSSL = true;

if(!isSSL){
    app   = require('express')();
    http  = require('http').Server();

    //ws    = new WebSocket.Server({ port : 8080 });

    ws = new WebSocket.Server({ port: 8080 });
}else{
    let keyFileURI  = '';
    let certFileURI = '';

    //find certs
    shellExec('ls /etc/letsencrypt/live/*/privkey.pem').then(function(result){
        keyFileURI = result.stdout.trim();

        shellExec('ls /etc/letsencrypt/live/*/fullchain.pem').then(function(result){
            certFileURI = result.stdout.trim();

            let options = {
                key  : fs.readFileSync(keyFileURI),
                cert : fs.readFileSync(certFileURI)
            };

            app   = require('express')();
            http  = require('https').Server(options, app);
            ws    = new WebSocket.Server({ server : http });

            serverURL = keyFileURI;

            http.listen(443, function(){
                server.init();
            });
        });
    });
}

const server = {
    players : [],
    init : function(){
        ws.on('connection', function(socket, ws){
            console.log('A user connected!');

            var id = Math.floor(Math.random() * 10000000);

            socket.playerId = id;
            socket.position = { x : 0, y : 0, z : 0 };
            server.players.push(socket);

            var ipAddress = ws.headers['x-forwarded-for'] || ws.connection.remoteAddress;
            console.log(ipAddress);
            
            socket.on('close', function(data) {
                server.players.splice(server.players.indexOf(socket), 1);

                server.players.forEach(p => {
                    p.send(JSON.stringify({ action : 'player-left', pp : server.players.length }));
                });
            });

            socket.on('message', function(result) {
                var res = JSON.parse(result);

                if(res.action === 'player-connected') {
                    server.players.forEach(p => {
                        p.send(JSON.stringify({ 
                            action   : 'player-joined', 
                            pp       : server.players.length, 
                            playerId : socket.playerId 
                        }));
                    });

                    //send all current players

                    for(var playerIndex in server.players){
                        var player = server.players[playerIndex];

                        socket.send(JSON.stringify({ 
                            action   : 'player-joined', 
                            pp       : server.players.length, 
                            playerId : player.playerId 
                        }));
                    }
                }

                if(res.action === 'player-location') {
                    // server.players.forEach(p => {
                    //     server.positions[p.id] = res.position;
                    // });
                    socket.position = res.position;

                    server.players.forEach(p => {
                        p.send(JSON.stringify({ 
                            action   : 'position', 
                            playerId : socket.playerId,
                            position : socket.position
                        }));
                    });
                }
            });
        });
    }
};