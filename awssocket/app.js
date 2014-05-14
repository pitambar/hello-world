
//Include the cluster module
var cluster = require('cluster');
var https = require('https');
//Code to run if we're in the master process
if (cluster.isMaster) {

 // Count the machine's CPUs
 var cpuCount = require('os').cpus().length;

 // Create a worker for each CPU
 for (var i = 0; i < cpuCount; i += 1) {
     cluster.fork();
 }

 // Listen for dying workers
 cluster.on('exit', function (worker) {

     // Replace the dead worker, we're not sentimental
     console.log('Worker ' + worker.id + ' died :(');
     cluster.fork();

 });

//Code to run if we're in a worker process
} else {
	/**
	 * Module dependencies.
	 */

	var express = require('express')
	  , routes = require('./routes')
	  , user = require('./routes/user')
	  , http = require('http')
	  ,mysql = require('mysql')
	  , path = require('path');
	var AWS = require('aws-sdk');


	var client = mysql.createConnection({
		host : 'instancegupshup.c8favxvxlbvh.us-west-2.rds.amazonaws.com',
		user : 'curious',
		password : '12345678',
		database:'mygupshup',
		port 	 :'3306'
	});

	client.connect(function(err) {
		  if (err) {
			    console.error('error connecting: ' + err.stack);
			    return;
			  }

			  console.log('connected to mysql');
			});
	//184.168.221.57
	var app = express();

	// all environments
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));

	var server = app.listen(app.get('port'));
	var io = require('socket.io').listen(server);
	io.set('tr	ansports', ['xhr-polling']);

	// development only
	if ('development' == app.get('env')) {
	  app.use(express.errorHandler());
	}

	//routing
	app.get('/', function (req, res) 
			{
		res.render('layout.jade');
	});
	app.use(function(err, req, res, next){
		//handling failed request
		console.error(err.stack);
		res.send(500, 'Oh no! Something failed');
		});

	// usernames which are currently connected to the chat
	var usernames = {};

	// rooms which are currently available in chat
	var rooms = ['room1','room2','room3'];

	io.sockets.on('connection', function (socket) {
		
		// when the client emits 'adduser', this listens and executes
		socket.on('signup', function(username)
		{
			client.query('SELECT * FROM USER', function(adduserERROR,userRESULT) 
			{
				if (adduserERROR)
				{
					console.log("adduserERROR" + adduserERROR);
				}
				else
					{
						var matched=false;
						for (var i = 0; i < userRESULT.length; i++)
						{
							console.log('username : ' +username);
							console.log('userRESULT : ' +userRESULT[i]['USER_NAME']);
							
							if(username == userRESULT[i]['USER_NAME'])
								{
									console.log('inside if loop '+ username);
									console.log('user name exists : '+userRESULT[i]['USER_NAME']);
									matched=true;
									i=userRESULT.length;
									
								}
							
					       // console.log('userRESULT :' +
							// userRESULT[i]['USER_NAME']); // [{1: 1}]
					  
					    }
						console.log('matched : '+matched);
						if(matched == false)
							{
								client.query("INSERT INTO mygupshup.USER (USER_NAME)"+"VALUES('"+username + "');", function(err, rows)
								{
									if(err)
										{
											console.log("error insert "+err);
										}
									else
										{
											console.log("rows insert"+rows);
											// store the room name in the socket
											// session for this client
											socket.myroom = 'room1';
											// add the client's username to the
											// global list
											socket.chatuser = username;
											
											// send client to room 1
											socket.join('room1');
											// echo to client they've connected
											socket.emit('updatechat',socket.myroom, 'SERVER', 'you have connected to room1');
											// echo to room 1 that a person has
											// connected to their room
											socket.broadcast.to('room1').emit('updatechat',socket.myroom, 'SERVER', username + ' has connected to this room');
											socket.emit('updaterooms', rooms, 'room1');
											socket.emit('ERROR',"welcome",username);
											
										}
								});
				
							}
						else
							{
							
								// console.log('user name already exists');
								io.sockets.emit('ERROR',"exists",username);
							}
					}
				
				
			});
			
		});
		
		socket.on('signin', function(username)
		{
			client.query('SELECT * FROM USER', function(adduserERROR,userRESULT) 
					{
						if (adduserERROR)
						{
							console.log("adduserERROR" + adduserERROR);
						}
						else
							{
								var matched=false;
								for (var i = 0; i < userRESULT.length; i++)
								{
									console.log('username : ' +username);
									console.log('userRESULT : ' +userRESULT[i]['USER_NAME']);
									
									if(username == userRESULT[i]['USER_NAME'])
										{
											console.log('inside if loop '+ username);
											console.log('user name exists : '+userRESULT[i]['USER_NAME']);
											matched=true;
											i=userRESULT.length;
											
										}
							    }
								if(matched == false)
								{
									io.sockets.emit('ERROR',"notexists",username);
								}
							else
								{
									// store the room name in the socket session for
									// this client
									socket.myroom = 'room1';
									// add the client's username to the global list
									socket.chatuser = username;
									console.log('socket.chatuser : '+socket.chatuser);
									// send client to room 1
									socket.join('room1');
									// echo to client they've connected
									socket.emit('updatechat',socket.myroom, 'SERVER', 'you have connected to room1');
									// echo to room 1 that a person has connected to
									// their room
									socket.broadcast.to('room1').emit('updatechat',socket.myroom, 'SERVER', username+ ' has connected to this room');
									socket.emit('updaterooms', rooms, 'room1');
									socket.emit('ERROR',"loggedin",username);
									
										client.query('SELECT * FROM MESSAGETABLE ', function(err,rows)
											{
												if(err)
													{
														console.log("error select message "+err);
													}
												else
													{
														console.log("rows insert"+rows);
														for (var i = 0; i < rows.length; i++)
														{
															console.log('rows : ' +rows[i]['roomId']);
															console.log('rows : ' +rows[i]['senderName']);
															console.log('rows : ' +rows[i]['messageContent']);
															// we tell the client to
															// execute 'updatechat'
															// with 2 parameters
															io.sockets.in(rows[i]['roomId']).emit('updatechat',rows[i]['roomId'],rows[i]['senderName'], rows[i]['messageContent']);
															
													    }
														
														
													}
											});
									
									
								}
								
							}
					});
		});
		socket.on('switchRoom', function(newroom){
			socket.leave(socket.myroom);
			socket.join(newroom);
			socket.emit('updatechat',newroom, 'SERVER', 'you have connected to '+ newroom);
			// sent message to OLD room
			socket.broadcast.to(socket.myroom).emit('updatechat',socket.myroom, 'SERVER', socket.chatuser+' has left this room');
			// update socket session room title
			socket.myroom = newroom;
			socket.broadcast.to(newroom).emit('updatechat',newroom,'SERVER', socket.chatuser+' has joined this room');
			socket.emit('updaterooms', rooms, newroom);
			
			client.query('SELECT * FROM MESSAGETABLE WHERE roomId="'+ socket.myroom + '"', function(err,rows)
					{
						if(err)
							{
								console.log("error select message "+err);
							}
						else
							{
								console.log("rows insert"+rows);
								for (var i = 0; i < rows.length; i++)
								{
									console.log('rows : ' +rows[i]['roomId']);
									console.log('rows : ' +rows[i]['senderName']);
									console.log('rows : ' +rows[i]['messageContent']);
									// we tell the client to execute 'updatechat'
									// with 2 parameters
									io.sockets.in(rows[i]['roomId']).emit('updatechat',rows[i]['roomId'],rows[i]['senderName'], rows[i]['messageContent']);
									
							    }
								
								
							}
					});
			
			
			
		});
		
		// when the client emits 'sendchat', this listens and executes
		socket.on('sendchat', function (data) 
		{
			client.query("INSERT INTO mygupshup.MESSAGETABLE (roomId,senderName,messageContent)"+"VALUES('"+socket.myroom + "','"+socket.chatuser + "','"+data + "');", function(err, rows)
					{
						if(err)
							{
								console.log("error insert "+err);
							}
						else
							{
								console.log("rows insert"+rows);
								// we tell the client to execute 'updatechat' with 2
								// parameters
								io.sockets.in(socket.myroom).emit('updatechat',socket.myroom,socket.chatuser, data);
								
							}
					});
			
		});
		/*// when the user ie typing
		socket.on('typing', function ()
		{
			
			socket.broadcast.to(socket.myroom).emit('typingCallBack');
		});
		// when the user ie typing
		socket.on('typingOut', function ()
		{
			
			socket.broadcast.to(socket.myroom).emit('typingOutCallBack');
		});
		*/
		// when the user disconnects.. perform this
		socket.on('disconnect', function(){
			
		});
	});
	/*http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
	});*/


 console.log('Worker ' + cluster.worker.id + ' running!');

}
