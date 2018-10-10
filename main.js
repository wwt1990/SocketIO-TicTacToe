$(function() {
  'use strict';
  var P1 = 'X', P2 = 'O';
  var socket = io.connect('http://localhost:3030'),
      player,
      game;

  // Player Class
  var Player = function(name, type){
      this.name = name;
      this.type = type;
      this.currentTurn = true;
      this.playsArr = 0;
  }

  Player.wins = [7, 56, 448, 73, 146, 292, 273, 84];

  Player.prototype.setPlaysArr = function(tileValue){
      this.playsArr += tileValue;
  }

  Player.prototype.getPlaysArr = function(tileValue){
      return this.playsArr;
  }

  Player.prototype.setCurrentTurn = function(turn){
      this.currentTurn = turn;
      if(turn)
          $('#turn').text('Your turn...');
      else
          $('#turn').text('Waiting for Opponent...');
  }

  Player.prototype.getPlayerName = function(){
      return this.name;
  }

  Player.prototype.getPlayerType = function(){
      return this.type;
  }

  Player.prototype.getCurrentTurn = function(){
      return this.currentTurn;
  }

  //Game Class
  var Game = function(roomId){
      this.roomId = roomId;
      this.board = [];
      this.moves = 0;
  }

  Game.prototype.getRoomId = function(){
      return this.roomId;
  }

  Game.prototype.displayBoard = function(message){
      $('.menu').css('display', 'none');
      $('.gameBoard').css('display', 'block');
      $('#userHello').html(message);
      this.createGameBoard();
  }

  Game.prototype.createGameBoard = function(){
      for(var i=0; i<3; i++) {
          this.board.push(['','','']);
          for(var j=0; j<3; j++) {
              $(`#button_${i}${j}`).on('click', function(){
                  //Check for turn
                  if(!player.getCurrentTurn()){
                      alert('Its not your turn!');
                      return;
                  }

                  if($(this).prop('disabled')){
                      alert('This tile has already been played on!');
                  }

                  var row = parseInt(this.id.split('_')[1][0]);
                  var col = parseInt(this.id.split('_')[1][1]);
                  game.playTurn(this);
                  game.updateBoard(player.getPlayerType(), row, col, this.id);

                  player.setCurrentTurn(false);
                  player.setPlaysArr(1 << (row * 3 + col));

                  game.checkWinner();

                  return false;
              });
          }
      }
  }

  Game.prototype.updateBoard = function(type, row, col, tile){
      $('#'+tile).text(type);
      $('#'+tile).prop('disabled', true);
      this.board[row][col] = type;
      this.moves ++;
  }

  Game.prototype.playTurn = function(tile){
      var clickedTile = $(tile).attr('id');
      var turnObj = {
          tile: clickedTile,
          room: this.getRoomId()
      };
      socket.emit('playTurn', turnObj);
  }

  Game.prototype.endGame = function(message){
      alert(message);
      location.reload();
  }

  Game.prototype.checkWinner = function(){
      var currentPlayerPositions = player.getPlaysArr();
      Player.wins.forEach(function(winningPosition){
          if(winningPosition && currentPlayerPositions == winningPosition){
              game.announceWinner();
          }
      });

      var tied = this.checkTie();
      if(tied){
          socket.emit('gameEnded', {room: this.getRoomId(), message: 'Game Tied :('});
          alert('Game Tied :(');
          location.reload();
      }
  }

  Game.prototype.checkTie = function(){
      return this.moves > 9;
  }

  Game.prototype.announceWinner = function(){
      var message = player.getPlayerName() + ' wins!';
      socket.emit('gameEnded', {room: this.getRoomId(), message: message});
      alert(message);
      location.reload();
  }

  //Create a new game.
  $('#newBtn').on('click', function(){
      var name = $('#nameNew').val();
      if(!name){
          alert('Please enter your name.');
          return;
      }
      socket.emit('createGame', {name: name});
      player = new Player(name, P1);
  });

  //Join an existing game
  $('#joinBtn').on('click', function(){
      var name = $('#nameJoin').val();
      var roomID = $('#room').val();
      if(!name || !roomID){
          alert('Please enter your name and game ID.');
          return;
      }
      socket.emit('joinGame', {name: name, room: roomID});
      player = new Player(name, P2);
  });

  //New Game created. Update UI.
  socket.on('newGame', function(data){

      var message = 'Hello, ' + data.name +
          '. Please ask your friend to enter Game ID: ' +
          data.room + '. Waiting for player 2...';

      // Create game for player 1
      game = new Game(data.room);
      game.displayBoard(message);
  });

  //If player creates the game, He is the the host
  socket.on('player1', function(data){
      var message = 'Hello, ' + player.getPlayerName();

      // Reset the message for the player
      $('#userHello').html(message);

      // Set the current player's turn
      player.setCurrentTurn(true);
  });

  //Joined the game, so player is player 2
  socket.on('player2', function(data){
      var message = 'Hello, ' + data.name;

      //Create game for player 2
      game = new Game(data.room);
      game.displayBoard(message);

      // First turn is of player 1, so set to false
      player.setCurrentTurn(false);
  });

  //Opponent played his turn. Update UI.
  socket.on('turnPlayed', function(data){
      var row = data.tile.split('_')[1][0];
      var col = data.tile.split('_')[1][1];
      var opponentType = player.getPlayerType() == P1 ? P2 : P1;
      game.updateBoard(opponentType, row, col, data.tile);
      player.setCurrentTurn(true);
  });

  socket.on('gameEnd', function(data){
      game.endGame(data.message);
      socket.leave(data.room);
  })

  socket.on('err', function(data){
      game.endGame(data.message);
  });
});
