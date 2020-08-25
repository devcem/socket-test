const WebSocket = require('ws');
 
const WebSocketServer = new WebSocket.Server({ port: 8080 });

var players = [];

WebSocketServer.on('connection', function(socket){
	console.log('A user connected!');

	socket.on('message', function(result){
		var data = JSON.parse(result);

		if(data.action == 'set-username'){
			socket.username = data.username;
			console.log(data.username, ' joined to the server, say welcome!');

			var playersList = players.map(function(player){
				return player.username;
			});

			socket.send(JSON.stringify({ action : 'players-list', players : playersList }));
		}
	});

	socket.on('close', function(data){
		console.log('User left!');

		players.splice(players.indexOf(socket), 1);
	});

	//socket.send('welcome!');

	socket.send(JSON.stringify({ action : 'request-username' }));
	players.push(socket);
	console.log('Online players : ', players.length);
});