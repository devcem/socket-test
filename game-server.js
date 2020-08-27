const WebSocket = require('ws');
const express = require('express');
const { createWebSocketStream } = require('ws');
 
const WebSocketServer = new WebSocket.Server({ port: 2053, server : server });

const server = {
    players : []
};

WebSocketServer.on('connection', function(socket, ws){
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