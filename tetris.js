//By Elijah Cirioli

//setup canvases
var canvas = document.getElementById("layer1");
var context = canvas.getContext("2d");
var flashLayer = document.getElementById("layer2");
var fl = flashLayer.getContext("2d");

//game information
var playing = false; //is the game actively being run
var squareSize = 32; //how many pixels across is a signal tile
var screenBounds = [132, -96]; //the corners of the playfield
var currentPiece = []; //the current tetrimino falling
var holdPiece = []; //the current tetrimino being held
var board = []; //the game board
var x = 0; //the x coordinate of the current tetrimino
var y = 0; //the y coordinate of the current tetrimino
var rotation = 0; //the rotation of the current tetrimino
var randomBag = []; //the bag of possible random tetriminoes
var queue = []; //the next three tetriminoes to fall

//scoring and levels
var score = 0; //the player's current score
var highscore = ["", 0]; //the highest score the player has achieved locally
var totalLines = 0; //the total number of lines cleared in a game
var time; //how long the game lasted
var tempTime = 0; //for tracking time when pausing
var level = 1; //game difficulty
var multiplier = 1.0; //score multipier based on level
var linesRemaining = 10; //lines to get to next level
var levelLines = [0, 10, 15, 20, 20, 30, 30, 40, 40, 50, 60, 70, 80, 90, 100, 100, -1]; //the number of lines needed to clear each level
var speeds = [0, 1000, 940, 880, 820, 760, 700, 640, 580, 520, 460, 400, 340, 280, 220, 160, 100]; //how fast tetriminoes fall

//controlling consecutive actions
var tetrisStreak = 0; //how many tetrises in a row the player has scored
var tSpin = false; //is the player currently perfoming a t-spin
var rotated = false; //have the player rotated without releasing the key
var held = false; //have they held the current piece
var pressedDown = false; //is the player holding the down arrow
var pressedUp = false; //is the player holding the up arrow
var pressedR = false; //is the player holding the right arrow 
var pressedL = false; //is the player holding the left arrow 

//menu settings
var ghostBlocks = true; //does the player want ghost blocks to appear?
var grid = false; //does the player want a guideline grid?
var DAS = 250; //ms of delay when holding down the arrow keys >____>>>>>>>>>
var advanced = true; //does the player want to use advanced controls?
var palette = 0; //which block palette the player is using
var sfxVolume = 10; //how loud are the sound effects
var musicVolume = 10; //how loud is the music

//menu variables
var state = 0; //where they are in the menu

//leaderboard variables
var scoreIndex = 0; //where are they in displaying scores
var scoreArray = []; //all the high scores combined with names and numbers 
var topScores = []; //the array of the top 6 high scores
var topNames = []; //the array of the names of the top 6 scores
var topNums = []; //the ranking of the top 6 scores to be displayed
var name = "";
var nameVals = [0, 0, 0, 0];

//misc
var anticheat = false; //should dev tools be allowed?

//draw board and tetriminoes
function draw() {
	context.drawImage(bgImage, 0, 0); //draw background image
	
  //draw guide grid
  if (grid) {
  	drawGrid();
  }
  
	//draw fallen blocks
	for (var i = 4; i < board.length; i++) {
    for (var j = 0; j < 10; j++) {
			if (board[i][j] !== 0) {
				context.drawImage(tImage, (board[i][j] - 1) * 32, 0, 32, 32, screenBounds[0] + (j * squareSize), screenBounds[1] + (i * squareSize), squareSize, squareSize);
			}
		}
	}
	
	//draw where block will land
	if (ghostBlocks && playing) {
		ghostBlock();		
	}
	
	//draw current tetrimino
	for (var k = 0; k < 4; k++) {
		for (var l = 0; l < 4; l++) {
			if (currentPiece[rotation][k][l] !== 0 && (y + k) >= 4) {
				context.drawImage(tImage, (currentPiece[rotation][k][l] - 1) * 32, 0, 32, 32, screenBounds[0] + (x * squareSize) + (l * squareSize), screenBounds[1] + (y * squareSize) + (k * squareSize), squareSize, squareSize);
			}
		}
	}
	
	//draw queue
	for (var q = 0; q < 4; q++) {
		for (var p = 0; p < 4; p++) {
			if (queue[0][0][q][p] !== 0) {
				if (queue[0] === O) {
					context.drawImage(tImage, (queue[0][0][q][p] - 1) * 32, 0, 32, 32, 458 + (p * 24), 53 + (q * 24), 24, 24);
				} else if (queue[0] === I) {
					context.drawImage(tImage, (queue[0][0][q][p] - 1) * 32, 0, 32, 32, 462 + (p * 22), 45 + (q * 22), 22, 22);
				} else {
					context.drawImage(tImage, (queue[0][0][q][p] - 1) * 32, 0, 32, 32, 470 + (p * 24), 53 + (q * 24), 24, 24);
				}
			}
		}
	}
	
	for (var o = 1; o < 3; o++) {
		for (var m = 0; m < 4; m++) {
			for (var n = 0; n < 4; n++) {
				if (queue[o][0][m][n] !== 0) {
					if (queue[o] === O) {
						context.drawImage(tImage, (queue[o][0][m][n] - 1) * 32, 0, 32, 32, 454 + (n * 18), 72 + (o * 70) + (m * 18), 18, 18);
					} else if (queue[o] === I) {
						context.drawImage(tImage, (queue[o][0][m][n] - 1) * 32, 0, 32, 32, 462 + (n * 14), 70 + (o * 70) + (m * 14), 14, 14);
					} else {
						context.drawImage(tImage, (queue[o][0][m][n] - 1) * 32, 0, 32, 32, 462 + (n * 18), 72 + (o * 70) + (m * 18), 18, 18);
					}
				}
			}
		}
	}
	
	//draw hold piece
	if (holdPiece.length > 0) {
		for (var s = 0; s < 4; s++) {
			for (var r = 0; r < 4; r++) {
				if (holdPiece[0][s][r] !== 0) {  
					if (holdPiece.toString() === O.toString()) {
						context.drawImage(tImage, (holdPiece[0][s][r] - 1) * 32, 0, 32, 32, 30 + (r * 24), 53 + (s * 24), 24, 24);
					} else if (holdPiece.toString() === I.toString()) {
						context.drawImage(tImage, (holdPiece[0][s][r] - 1) * 32, 0, 32, 32, 34 + (r * 22), 45 + (s * 22), 22, 22);
					} else {
						context.drawImage(tImage, (holdPiece[0][s][r] - 1) * 32, 0, 32, 32, 42 + (r * 24), 53 + (s * 24), 24, 24);
					}
				}
			}
		}
	}

	//draw score sidebar
	context.fillStyle = "white";
	context.strokeStyle = "white";
	context.lineWidth = 5;
	context.beginPath();
	context.rect(475, 325, 105, 170);
	context.stroke();

	context.textAlign = "center";
	context.font = "600 20px Arial";
	context.fillText("SCORE", 528, 350);
	context.fillText("LEVEL", 528, 405);
	context.fillText("LINES", 528, 460);
	
	context.font = "100 20px Arial";
	context.fillText(score, 528, 373);
	context.fillText(level, 528, 428);
	if (level < 16) {
		context.fillText(linesRemaining, 528, 483);
	} else {
		context.font = "30px Arial";
		context.fillText("∞", 528, 483);
	}
}

//move all the current tetriminos down and lock into place
function gravity() {
  clearLines(); //clear lines before adding new ones to array for one cycle delay
  //see if piece can move down
  if (canMove(x, y + 1, rotation)) {
    if (!pressedDown) {
		  y++;
    }
  } else { //if it can't move down
    //check for t-spins
    tSpin = (currentPiece === T && !canMove(x + 1, y, rotation) && !canMove(x - 1, y, rotation) && !canMove(x, y - 1, rotation)); 
    
    //add to board array
		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 4; j++) {
				if (currentPiece[rotation][j][i] !== 0) {
					board[y + j][x + i] = currentPiece[rotation][j][i];
				}
			}
		}
		
    //give new piece and update queue
		currentPiece = queue[0];
		queue[0] = queue[1];
		queue[1] = queue[2];
		queue[2] = newPiece();
    
		held = false;
		
    //check if they lost
    if (!canMove(x, y, rotation)) {
      if (score > highscore[1]) {
        highscore[1] = score;
			}
      
      playing = false;
      state = -1;
			clearInterval(thread);
			
			tempTime += new Date() - time;
			
			context.fillStyle = "rgba(0, 0, 0, 0.5)";
			context.fillRect(0, 0, 600, 640);
			context.fillStyle = "white";
			context.font = "800 85px Arial";
			context.fillText("GAME", 292, 290);
			context.fillText("OVER", 292, 375);
			
			setTimeout(deathAnimation, 1000, 25);
			return;
    }
	}
	draw();
	
  //begin line flashing animation
	for (var m = 0; m < board.length; m++) {
		if (!board[m].includes(0)) {
			flashLines(m, 6);
		}
	}
}

//return whether tetrimino can move to new position
function canMove(newX, newY, newRotation) { //returns whether the current tetrimino can be moved to a given location
	for (var i = 0; i < 4; i++) {
		for (var j = 0; j < 4; j++) {
			if (currentPiece[newRotation][j][i] !== 0) {
				//check left and right bounds of gamefield
				if (newX + i < 0 || newX + i > 9) {
					return false;
				}
				//check lowerbound of gamefield
				if (newY + j > 21) {
					return false;
				}
				//check if tiles are occupied
				if (board[newY + j][newX  + i] !== 0) {
					return false;
				}
			}
		}
	}
	return true;
}

//return a new random tetrimino from the bag
function newPiece() {
	//reset position
	x = 3;
	y = 2;
	rotation = 0;
  
  //pick a random piece
	var nextIndex = Math.floor(Math.random() * randomBag.length);
	var nextPiece = randomBag[nextIndex];
	randomBag.splice(nextIndex, 1);
	
  if (randomBag.length === 0) {
		randomBag = [I, J, L, O, S, T, Z];
  }
  
	return nextPiece;
}

//clear completed lines and award points
function clearLines() {
	//clear lines
	var lineCount = 0;
	for (var i = 0; i < board.length; i++) {
		if (!board[i].includes(0)) { //if line is full
    	//move non-locked piece down
    	if (!canMove(x, y + 1, rotation)) {
      	y++;
      }
      //move everything down
			for (var j = i; j > 0; j--) {
				board[j] = board[j - 1].slice();
			}
			lineCount++;
		}
	}
	
	totalLines += lineCount;
	
	//play sound effect
	if (lineCount > 0) {
	  lcSound.pause();
    lcSound.currentTime = 0;
		lcSound.play();
	}
	
	if (lineCount > 0) {
	  clearTimeout(pointsThread);
	  
  	//add points
  	if (lineCount === 1) {
  	  tetrisStreak = 0;
  		if (tSpin) {
  	    score += Math.round(140 * multiplier);
  	    displayPoints((140 * multiplier) + " SINGLE", 0, true);
  	  } else {
  	    score += Math.round(40 * multiplier);
  	    displayPoints((40 * multiplier) + " SINGLE", 0, false);
  	  }
  		
  	} else if (lineCount === 2) {
  	  tetrisStreak = 0;
  		if (tSpin) {
  	    score += Math.round(400 * multiplier);
  	    displayPoints((400 * multiplier) + " DOUBLE", 0, true);
  	  } else {
  	    score += Math.round(100 * multiplier);
  	    displayPoints((100 * multiplier) + " DOUBLE", 0, false);
  	  }
  		
  	} else if (lineCount === 3) {
  	  tetrisStreak = 0;
  		if (tSpin) {
  	    score += Math.round(500 * multiplier);
  	    displayPoints((500 * multiplier) + " TRIPLE", 0, true);
  	  } else {
  	    score += Math.round(300 * multiplier);
  	    displayPoints((300 * multiplier) + " TRIPLE", 0, false);
  	  }
  		
  	} else if (lineCount === 4) {
  	  tetrisStreak++;
  		score += Math.round(1200 * multiplier);
  		if (tetrisStreak >= 2) {
  			score += Math.round(800 * multiplier * (tetrisStreak - 1));
  			displayPoints((((800 * (tetrisStreak - 1)) + 1200) * multiplier) + " ", 0, false);
  		} else {
  		  displayPoints((1200 * multiplier) + " TETRIS", 0, false);
  		}
  	}
	}
	
	//level system
	if (level < 16) {
		linesRemaining -= lineCount;
		if (linesRemaining <= 0) {
			level++;
			linesRemaining += levelLines[level];
			multiplier += 0.2;
			clearInterval(thread);
			thread = setInterval(gravity, speeds[level]);
		}
	}
}

function displayPoints(str, count, showT) { //animation for how many points they just scored
  fl.clearRect(0, 0, screenBounds[0], 640);
  if (playing) { 
    var disp = str.split(" ");
    var alpha = 1.25 - (count / 40);
    
    fl.textAlign = "center";	
    
    fl.font = "600 30px Arial";
    fl.fillStyle = "rgba(255, 255, 255, " + alpha + ")";    
  	fl.fillText("+" + Math.round(disp[0]) + " ", screenBounds[0] / 2, 470 - count);
  	
  	if (tetrisStreak >= 2) { //if it's a back to back tetris
    	if (tetrisStreak === 2) {
    	  fl.font = "300 13px Arial";
    	  fl.fillText("BACK TO BACK", screenBounds[0] / 2, 495 - count);
    	} else {
    	  fl.font = "300 16px Arial";
    	  fl.fillText(tetrisStreak + " STREAK", screenBounds[0] / 2, 495 - count);
    	}
  	  
  	  fl.font = "300 23px Arial";
  	  fl.fillText("TETRIS", screenBounds[0] / 2, 520 - count);
  	} else if (showT) {
  	  fl.font = "300 20px Arial";
    	fl.fillText("T-SPIN", screenBounds[0] / 2, 495 - count);
  	  
  	  fl.font = "300 23px Arial";
  	  fl.fillText(disp[1], screenBounds[0] / 2, 520 - count);
  	} else {
  	  fl.font = "300 23px Arial";
  	  fl.fillText(disp[1], screenBounds[0] / 2, 500 - count);
  	}
  		
    if (count < 50) {
      pointsThread = setTimeout(displayPoints, 60, str, count + 1, showT); 
    } else {
      fl.clearRect(0, 0, screenBounds[0], 640);
    }
  }
}

function flashLines(line, count) { //line clear animation
	if (count % 2 === 0 && playing) {
		fl.fillStyle = "white";
		fl.fillRect(screenBounds[0], screenBounds[1] + (line * squareSize), squareSize * 10, squareSize);
	} else {
		fl.clearRect(screenBounds[0], screenBounds[1] + (line * squareSize), squareSize * 10, squareSize);
	}
	if (count > 1) {
		setTimeout(flashLines, speeds[level] / 7, line, count - 1);
	}
}

function ghostBlock() { //detect edges and draw a border
	var offset = 0;
	for (var o = y; o < 22; o++) {
		if (!canMove(x, o, rotation)) {
			offset = o - y - 1;
			break;
		}
	}
	
  //draw a bunch of rectangles at block borders
	if (offset !== 0) {
		context.fillStyle = "white";
	
		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 4; j++) {
				if (currentPiece[rotation][i][j] !== 0 && (y + i + offset) > 3) {
					if (j === 0 || currentPiece[rotation][i][j - 1] === 0) { //left
						context.fillRect((x + j) * squareSize + screenBounds[0], (y + i + offset) * squareSize + screenBounds[1], 4, squareSize);
					}
					if (i === 0 || currentPiece[rotation][i - 1][j] === 0) { //top
						context.fillRect((x + j) * squareSize + screenBounds[0], (y + i + offset) * squareSize + screenBounds[1], squareSize, 4);
					}
					if (j === 3 || currentPiece[rotation][i][j + 1] === 0) { //right
						context.fillRect((x + j + 1) * squareSize + screenBounds[0] - 4, (y + i + offset) * squareSize + screenBounds[1], 4, squareSize);
					}
					if (i === 3 || currentPiece[rotation][i + 1][j] === 0) { //bottom
						context.fillRect((x + j) * squareSize + screenBounds[0], (y + i + 1 + offset) * squareSize + screenBounds[1] - 4, squareSize, 4);
					}
					if (j < 3 && i > 0 && currentPiece[rotation][i - 1][j + 1] === 0 && currentPiece[rotation][i - 1][j] !== 0 && currentPiece[rotation][i][j + 1] !== 0) { //top right diagonal
						context.fillRect((x + j + 1) * squareSize + screenBounds[0] - 4, (y + i + offset) * squareSize + screenBounds[1], 4, 4);
					}
					if (j > 0 && i < 3 && currentPiece[rotation][i + 1][j - 1] === 0 && currentPiece[rotation][i + 1][j] !== 0 && currentPiece[rotation][i][j - 1] !== 0) { //bottom left diagonal
						context.fillRect((x + j) * squareSize + screenBounds[0], (y + i + 1 + offset) * squareSize + screenBounds[1] - 4, 4, 4);
					}
					if (j > 0 && i > 0 && currentPiece[rotation][i - 1][j - 1] === 0 && currentPiece[rotation][i - 1][j] !== 0 && currentPiece[rotation][i][j - 1] !== 0) { //top left diagonal
						context.fillRect((x + j) * squareSize + screenBounds[0], (y + i + offset) * squareSize + screenBounds[1], 4, 4);
					}
					if (j < 3 && i < 3 && currentPiece[rotation][i + 1][j + 1] === 0 && currentPiece[rotation][i + 1][j] !== 0 && currentPiece[rotation][i][j + 1] !== 0) { //bottom right diagonal
						context.fillRect((x + j + 1) * squareSize + screenBounds[0] - 4, (y + i + 1 + offset) * squareSize + screenBounds[1] - 4, 4, 4);
					}
				}
			}
		}
	}
}

function drawGrid() {
	//set stroke to semi-transparent
	context.strokeStyle = "rgba(255, 255, 255, 0.2)";
  context.lineWidth = 1;
  
  //draw grid
	context.beginPath();
  for (var i = 1; i < 10; i++) {
  	context.moveTo(screenBounds[0] + (i * squareSize), screenBounds[1] + (4 * squareSize));
    context.lineTo(screenBounds[0] + (i* squareSize), screenBounds[1] + (22 * squareSize));
  }
  
  for (var j = 4; j < 22; j++) {
  	context.moveTo(screenBounds[0], screenBounds[1] + (j * squareSize));
    context.lineTo(screenBounds[0] + (10 * squareSize), screenBounds[1] + (j * squareSize))
  }
  
  context.stroke();
}

//prepare board and queue for a new game
function reset() {
	//define board array
	board = [
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0,0,0]
	];

	//setup bag and queue
	randomBag = [I, J, L, O, S, T, Z]; //the random tetriminos to pull from
	currentPiece = newPiece();
	queue = [newPiece(), newPiece(), newPiece()];
	
	//clear held piece
	holdPiece = [];
	
  playing = true;
  
	//score info
	score = 0;
	totalLines = 0;

	//consecutive variables
	tetrisStreak = 0;
	rotated = false;
	held = false; 
	pressedDown = false;
	pressedUp = false;
	pressedL = false;
	pressedR = false;
	
  //reset timer
	time = new Date();
	tempTime = null;
}

function menu(offset) {
	if (offset === 1601) {
		offset = 0;
	}
	
	//draw star background
	context.drawImage(mImage, -offset, 0);
	context.save();
	context.translate(1600 - offset, 0);
	context.scale(-1, 1);
	context.drawImage(mImage, 0, 0);
	context.restore();
	context.drawImage(mImage, 1600 -offset, 0);
	
  context.textAlign = "center";
	if (state === 0 || state === 1 || state === 999) { //main menu
  	context.fillStyle = "white";
		context.drawImage(lgImage, 0, 0, 300, 200, 125, 70, 350, 233);
    context.fillRect(125, 69, 350, 1);

		context.textAlign = "center";
		context.font = "600 40px Arial";

		context.fillText("PLAY", 300, 420);
		context.fillText("SETTINGS", 300, 500);
		
		if (state !== 999) {
  		context.strokeStyle = "white";
  		context.lineWidth = 5;
  		context.beginPath();
  		context.rect(155, 375 + (state * 80), 290, 61);
  		context.stroke();
		}
	} if (state === 2 || state === 3 || state === 200 || state === 201) { //level select screen
		context.font = "600 30px Arial";
		context.fillText("◀ BACK", 120, 70);
		context.font = "600 40px Arial";
    context.fillText("◀       LEVEL       ▶", 300, 390);
    context.font = "600 32px Arial";
    context.fillText("HIGHSCORES", 300, 115);
    context.font = "100 26px Arial";
    if (topNames.length > 0) {
      for (var i = 0; i < topNames.length; i++) {
        context.textAlign = "left";
        context.fillText(topScores[i], 210, 155 + (32 * i));
        context.textAlign = "right";
        context.fillText(topNums[i], 185, 155 + (32 * i));
        context.textAlign = "center";
        for (var j = 0; j < 4; j++) {
          if (topNames[i].substring(j, j + 1) !== "W") {
            context.fillText(topNames[i].substring(j, j + 1), 365 + (j * 20), 155 + (32 * i));
          } else {
            context.font = "200 26px Arial";
            context.save();
            context.scale(0.75, 1);
            context.fillText(topNames[i].substring(j, j + 1), 487 + (j * 27), 155 + (32 * i));
            context.restore();
            context.font = "100 26px Arial";
          }
        }
      }
    } else {
      var load = "LOADING SCORES"
      var loadCount = offset % 20;
      for (var i = 5; i < loadCount; i += 5) {
        load += ".";
      }
      context.textAlign = "left";
      context.fillText(load, 180, 170);
    }
    
    //draw level select
    var colors = ["LimeGreen", "Gold", "OrangeRed", "Red"];
		context.font = "600 80px Arial";
		context.textAlign = "center";
    if (level > 1) {
    	context.fillStyle = colors[Math.floor((level - 1) / 4.1)];
			context.fillRect(60, 430, 120, 120);
			context.fillStyle = "white";
			context.fillText(level - 1, 120, 521);
    }
		
		if (level < 16) {
    	context.fillStyle = colors[Math.floor((level + 1) / 4.1)];
			context.fillRect(420, 430, 120, 120);
			context.fillStyle = "white";
			context.fillText(level + 1, 480, 521);
    }
		
		if (state === 2) { //highlighting level
			context.fillStyle = "white";
			context.fillRect(215, 405, 170, 170)
		} else if (state === 3) { //highlighting back
			context.strokeStyle = "white";
			context.lineWidth = 5;
			context.beginPath();
			context.rect(40, 35, 165, 48);
			context.stroke();
		} else if (state === 201) { //highlighting highscores
			context.strokeStyle = "white";
			context.lineWidth = 5;
			context.beginPath();
			context.rect(165, 80, 270, 47);
			context.stroke();
		}
		
		context.fillStyle = colors[Math.floor(level / 4.1)];
		context.fillRect(221, 411, 158, 158);
		context.fillStyle = "white";
		context.font = "800 110px Arial";
		context.fillText(level, 300, 530);
	} if ((state >= 4 && state <= 11) || state === 500) { //settings menu
    context.font = "600 30px Arial";
    context.fillText("◀ BACK", 120, 70);
    
    context.strokeStyle = "white";
		context.lineWidth = 5;
    if (state >= 5 && state !== 500) { //highlighting settings
			context.beginPath();
			context.rect(40, 98 + ((state - 5) * 70), 520, 60);
			context.stroke();
    } else if (state === 4) { //highlighting back
			context.beginPath();
			context.rect(40, 35, 165, 48);
			context.stroke();
    }
    
    //draw all options
    context.textAlign = "left";
    context.font = "600 35px Arial";
    context.fillText("CONTROLS", 60, 140);
    context.fillText("GHOST PIECE", 60, 210);
    context.fillText("GUIDE GRID", 60, 280);
    context.fillText("DAS", 60, 350);
    context.fillText("PALETTE", 60, 420);
    context.fillText("MUSIC", 60, 490);
    context.fillText("SOUNDS", 60, 560);
    
    context.textAlign = "right";
    context.font = "150 35px Arial";
    if (advanced) {
    	context.fillText("ADVANCED", 540, 140);
    } else {
    	context.fillText("SIMPLIFIED", 540, 140);
    }
    if (ghostBlocks) {
    	context.fillText("ENABLED", 540, 210);
    } else {
    	context.fillText("DISABLED", 540, 210);
    }
    if (grid) {
    	context.fillText("ENABLED", 540, 280);
    } else {
    	context.fillText("DISABLED", 540, 280);
    }
  	context.fillText(DAS + "ms", 540, 350);
    
    context.drawImage(tImage, 316, 393);  
    
    var mVolString = "";
    for (var i = 1; i <= 10; i++) {
      if (i <= musicVolume) {
        mVolString += "■";
      } else {
        mVolString += "□";
      }
    }
    context.fillText(mVolString, 540, 486);
    
    var sVolString = "";
    for (var i = 1; i <= 10; i++) {
      if (i <= sfxVolume) {
        sVolString += "■";
      } else {
        sVolString += "□";
      }
    }
    context.fillText(sVolString, 540, 556);
	} else if (state === 14 || state === 140) { //leaderboard
	  context.textAlign = "center";
	  context.font = "600 30px Arial";
    context.fillText("◀ BACK", 120, 70);
    if ((scoreArray.length / 2) > scoreIndex + 10) {
      context.fillText("▼", 400, 610);
    }
    if (scoreIndex > 0) {
      context.fillText("▲", 200, 610);
    }
    context.font = "600 40px Arial";
    context.fillText("HIGHSCORES", 300, 119);
    context.font = "600 28px Arial";
    context.fillText("RANK", 110, 155);
    context.fillText("SCORE", 300, 155);
    context.fillText("NAME", 490, 155);
    
    //display data
    context.font = "100 28px Arial";
    if (scoreArray.length > 0) {
      for (var i = scoreIndex; i < scoreIndex + 10 && i < scoreArray.length / 2; i++) {
        context.fillText(i + 1, 110, 200 + (40 * (i - scoreIndex)));
        context.fillText(scoreArray[(i * 2) + 1], 300, 200 + (40 * (i - scoreIndex)));
         for (var j = 0; j < 4; j++) {
          if (scoreArray[i * 2].substring(j, j + 1) !== "W") {
            context.fillText(scoreArray[i * 2].substring(j, j + 1), 457 + (j * 22), 200 + (40 * (i - scoreIndex)));
          } else {
            context.font = "200 28px Arial";
            context.save();
            context.scale(0.75, 1);
            context.fillText(scoreArray[i * 2].substring(j, j + 1), 610 + (j * 29.5), 200 + (40 * (i - scoreIndex)));
            context.restore();
            context.font = "100 28px Arial";
          }
        }
      }
    } else {
      var load = "LOADING SCORES"
      var loadCount = offset % 20;
      for (var i = 5; i < loadCount; i += 5) {
        load += ".";
      }
      context.textAlign = "left";
      context.fillText(load, 170, 220);
    }
    
    if (state === 14) { //highlighting back
			context.beginPath();
			context.rect(40, 35, 165, 48);
			context.stroke();
    }
	} else if (state >= 51 && state <= 57) { //intial entering screen
    context.textAlign = "center";
    context.font = "600 30px Arial";
    context.fillText("◀ MENU", 120, 70);
    context.font = "600 40px Arial";
    context.fillText("ENTER INITIALS", 300, 130);
    context.font = "100 40px Arial";
    context.fillText(score, 300, 440);
    context.font = "600 35px Arial";
    context.fillText("SAVE SCORE", 300, 525);
    
    context.beginPath();
    if (state === 55) { //highlight menu
			context.rect(40, 35, 165, 48);
    } else if (state === 56) { //highlight save
      context.rect(150, 488, 300, 48);
    } else { //highlight letters
      var nameIndex = state - 51;
      context.rect(100 + (nameIndex * 100), 210, 100, 125);
      context.font = "600 60px Arial";
      context.fillText("▲", 150 + (nameIndex * 100), 200);
      context.fillText("▼", 150 + (nameIndex * 100), 386);
    }
    context.stroke();
    
    var charSet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", ".", "–"];
    name = charSet[nameVals[0]] + charSet[nameVals[1]] + charSet[nameVals[2]] + charSet[nameVals[3]];
    
    for (var i = 0; i < 4; i++) {
      if (nameVals[i] === 22) {
        context.font = "800 120px Arial";
        context.save();
        context.scale(0.75, 1);
        context.fillText(charSet[nameVals[i]], 200 + (133 * i), 315);
        context.restore();
      } else {
        context.font = "600 120px Arial";
        context.fillText(charSet[nameVals[i]], 150 + (100 * i), 315);
      }
    }
	}
	
  //tooltips
  context.fillStyle = "white";
	context.textAlign = "center";
	context.font = "100 11px Arial";
  if (state <= 4 || state === 999 || state === 200 || state === 500 || state === 201) {
		context.fillText("USE THE ARROW KEYS TO NAVIGATE AND PRESS THE SPACEBAR TO SELECT", 300, 630);
	} else if (state === 5) {
  	if (advanced) {
    	context.fillText("Z AND X TO ROTATE | DOWN TO SOFT DROP | UP TO HARD DROP | SPACE TO HOLD", 300, 630);
    } else {
    	context.fillText("UP TO ROTATE | DOWN TO SOFT DROP | SPACE TO HARD DROP | SHIFT TO HOLD", 300, 630);
    }
  } else if (state === 6) {
  	context.fillText("DISPLAY EXACTLY WHERE THE CURRENT PIECE IS GOING TO LAND", 300, 630);
  } else if (state === 7) {
  	context.fillText("DISPLAY A FAINT GUIDE TO HELP SEE WHERE PIECES WILL LAND", 300, 630);
  } else if (state === 8) {
  	context.fillText("HOW MUCH DELAY BETWEEN MOVING ONCE AND MOVING CONTINUOUSLY", 300, 630);
  } else if (state === 9) {
  	context.fillText("APPEARENCE OF INDIVIDUAL BLOCKS WITHIN GAME", 300, 630);
  } else if (state === 10) {
  	context.fillText("MUSIC BY JAMES NICHOLSON", 300, 630);
  } else if (state === 11) {
  	context.fillText("VOLUME OF IN GAME SOUND EFFECTS", 300, 630);
  }
  
	if (!playing) {
		menuThread = setTimeout(menu, 30, offset + 0.25);
	}
}

function deathAnimation(count) { //play when they die
	//move all pieces down
	for (var i = 21; i > 0; i--) {
		board[i] = board[i - 1].slice();
	}
	
  //display game over
	draw();
	context.fillStyle = "rgba(0, 0, 0, 0.5)";
	context.fillRect(0, 0, 600, 640);
	context.fillStyle = "white";
	context.font = "800 85px Arial";
	context.fillText("GAME", 292, 290);
	context.fillText("OVER", 292, 375);
			
	if (count > 0) { //repeat animation
		setTimeout(deathAnimation, 70, count - 1);
	} else { //draw ending stats	  
		draw();
		context.fillStyle = "rgba(0, 0, 0, 0.5)";
		context.fillRect(0, 0, 600, 640);
		context.strokeStyle = "white";
		context.beginPath();
		context.rect(164, 130, 8 * squareSize, 320);
		context.stroke();
		
    //convert time from milliseconds
		var hours = Math.floor(tempTime / 3600000);
		var minutes = Math.floor((tempTime - (hours * 3600000)) / 60000);
		var seconds = Math.floor((tempTime - (hours * 3600000) - (minutes * 60000)) / 1000);
		
    //draw results screen
		context.fillStyle = "white";
		context.font = "600 26px Arial";
		context.fillText("RESULTS", 292, 165);
		context.font = "150 14px Arial";
		context.fillText("PRESS SPACE TO CONTINUE", 292, 435);
		
		context.textAlign = "left";
		context.font = "600 20px Arial";
		context.fillText("SCORE", 178, 200);
		context.fillText("HIGHSCORE", 178, 250);
		context.fillText("TOTAL LINES", 178, 300);
		context.fillText("TIME", 178, 350);
		context.fillText("LEVEL", 178, 400);
		
		context.textAlign = "right";
		context.font = "150 20px Arial";
		context.fillText(score, 406, 200);
		context.fillText(highscore[1], 406, 250);
		context.fillText(totalLines, 406, 300);
		if (hours === 0) {
		  if (seconds < 10) {
		    context.fillText(minutes + ":0" + seconds, 406, 350);
		  } else {
			  context.fillText(minutes + ":" + seconds, 406, 350);
		  }
		} else {
		  if (seconds < 10) {
		    if (minutes < 10) {
		      context.fillText(hours + ":0" + minutes + ":0" + seconds, 406, 350);
		    } else {
		      context.fillText(hours + ":" + minutes + ":0" + seconds, 406, 350);
		    }
		  } else {
		    if (minutes < 10) {
		      context.fillText(hours + ":0" + minutes + ":" + seconds, 406, 350);
		    } else {
		      context.fillText(hours + ":" + minutes + ":" + seconds, 406, 350);
		    }
		  }
		}
		context.fillText(level, 406, 400);
    
		state = 50;
	}
}

function drawPause() { //draw the pause menu
	draw();

	//draw pause options
	context.fillStyle = "rgba(0, 0, 0, 0.5)";
  context.fillRect(0, 0, 600, 640);
  context.strokeStyle = "white";
  context.beginPath();
  context.rect(164, 220, 8 * squareSize, 160);
  if (state !== 120) {
    context.rect(210, 270 + (45 * (state - 12)), 164, 40);
  }
  context.stroke();

  context.fillStyle = "white";
  context.font = "600 26px Arial";
  context.fillText("PAUSE", 292, 255);
  context.font = "150 26px Arial";
  context.fillText("RESUME", 292, 300);
  context.fillText("QUIT", 292, 345);
}

function adjustVolume() { //adjust the volume of all sound effects
  hdSound.volume = 0.06 * sfxVolume;
  mSound.volume = 0.07 * sfxVolume;
  lcSound.volume = 0.06 * sfxVolume;
  cSound.volume = 0.06 * sfxVolume;
  song.volume = 0.1 * musicVolume;
}

function moveSide(direction) { //move continuously
	if (canMove(x + direction, y, rotation)) {
		x += direction;
		draw();
		
		mSound.pause();
    mSound.currentTime = 0.035;
    mSound.play();
		
		if (DAS === 75) {
		  if (direction > 0) {
        moveRight = setTimeout(moveSide, 75, direction);		
    	} else {
    	  moveLeft = setTimeout(moveSide, 75, direction);
    	}
		} else {
    	if (direction > 0) {
        moveRight = setTimeout(moveSide, 50, direction);		
    	} else {
    	  moveLeft = setTimeout(moveSide, 50, direction);
    	}
		}
	}
}

function moveVert() { //move continuously down
	if (canMove(x, y + 1, rotation)) {
		y++;
		draw();
	}
}

function hardDrop(repeat) { //drop the piece and lock it in
  if (playing) {
    while (canMove(x, y + 1, rotation)) {
  		y++;
  	}
  	draw();
  	
  	gravity();
  	if (playing) {
  		clearInterval(thread);
  		thread = setInterval(gravity, speeds[level]);
  	}
  	
  	hdSound.pause();
    hdSound.currentTime = 0;
  	hdSound.play();
  	
  	if (repeat) {
    	dropThread = setTimeout(hardDrop, 100, repeat);
  	}
  }
}

function rotate(direction) { //rotate pieces (call when button pressed)
	newRotation = rotation + direction;
	
	if (newRotation > 3) {
	  newRotation = 0;
	} else if (newRotation < 0) {
	  newRotation = 3;
	}
	
	//wall kicks
	if (!canMove(x, y, newRotation)) {
	  var JLSTZKicks = [[-1, 0], [-1, 1], [0, -2], [-1, -2]];
	  var IKicks = [[[-2, 0], [1, 0], [-2, -1], [1, 2]],
	                [[-1, 0], [2, 0], [1, -2], [2, -1]]];
	  
	  for (var i = 0; i < 4; i++) {
	    var addX = 0;
	    var addY = 0;
	    
	    if (currentPiece !== O) {
        if (currentPiece === I) {
          if (rotation + newRotation === 1 || rotation + newRotation === 5) {
    	      addX = IKicks[0][i][0];
    	      addY = IKicks[0][i][1];
    	      
    	      if (newRotation === 3 || newRotation === 0) {
              addX *= -1;
              addY *= -1;
            }
          } else {
    	      addX = IKicks[1][i][0];
    	      addY = IKicks[1][i][1];
    	      
    	      if (newRotation === 1 || newRotation === 0) {
              addX *= -1;
              addY *= -1;
            }
          }
      
        } else {
    	    addX = JLSTZKicks[i][0];
          addY = JLSTZKicks[i][1];
          
          if (newRotation === 3 || rotation === 1) {
            addX *= -1;
            addY *= -1;
          }
        }
        
    	  if (canMove(x + addX, y - addY, newRotation)) {
          x += addX;
          y -= addY;
          break;
        }
	    }
	  }
	}
	
	//actually rotate
	if (canMove(x, y, newRotation)) {
		rotation = newRotation;
		rotated = true;
	}
}

//key presses
document.onkeydown = function(e) {
  e = window.event || e;
  key = e.keyCode;
  e.preventDefault();
	var newRotation;
	
	if (playing) {
	  
		//move left
		if (key === 37) {
			if (!pressedL && canMove(x - 1, y, rotation)) {
        clearTimeout(moveLeft);
        clearTimeout(moveRight);
        x--;
        moveLeft = setTimeout(moveSide, DAS, -1);
        //play sound
  			mSound.pause();
        mSound.currentTime = 0;
  			mSound.play();
        pressedL = true;
			}
		}

		//move right
		if (key === 39) {
			if (!pressedR && canMove(x + 1, y, rotation)) {
        clearTimeout(moveLeft);
        clearTimeout(moveRight);
        x++;
        moveRight = setTimeout(moveSide, DAS, 1);
        //play sound
  			mSound.pause();
        mSound.currentTime = 0;
  			mSound.play();
        pressedR = true;
			}
		}

		//hard drop
		if ((key === 38 && advanced) || (key === 32 && !advanced)) {
			if (!pressedUp) {
			  clearTimeout(dropThread);
			  hardDrop(false);
			  dropThread = setTimeout(hardDrop, 300, true);
			  pressedUp = true;
			}
		}

		//soft drop
		if (key === 40) {
			if (!pressedDown && canMove(x, y + 1, rotation)) {
			  clearInterval(moveDown);
			  y++;
        moveDown = setInterval(moveVert, 50);
        pressedDown = true;
			}
		}

		//rotate right
		if ((key === 88 || (key === 38 && !advanced)) && !rotated) {
			rotate(1);
		}

		//rotate left
		if (key === 90 && !rotated) {
			rotate(-1);
		}

		//hold
		if (((key === 32 && advanced) || (key === 16 && !advanced)) && !held) {
			var temp = currentPiece.slice();
			if (holdPiece.length > 0) {
				currentPiece = holdPiece.slice();
			} else {
				currentPiece = queue[0];
				queue[0] = queue[1];
				queue[1] = queue[2];
				queue[2] = newPiece();
			}
			x = 3;
			y = 2;
			rotation = 0;
			holdPiece = temp.slice();
      held = true;
		}
    
    draw();
    
		//pause
		if (key === 27 || key === 80) {
			playing = false;
      clearInterval(thread);
      clearInterval(moveLeft);
      clearInterval(moveRight);
      clearInterval(moveDown);
      state = 12;
      
      tempTime += new Date() - time;
      
      drawPause();
      song.pause();
		}
	} else { //menu time
		if (key === 32 || key === 13) { //spacebar
			if (state === 0) { //level select
				state = 2;
				getHighScores()
			} else if (state === 1) { //options
      	state = 5;
      } else if (state === 2) { //start the game
				clearTimeout(menuThread);
				reset();
				multiplier = 1.0 + (0.2 * (level - 1));
				linesRemaining = levelLines[level];
        draw();
				thread = setInterval(gravity, speeds[level]);
				
				song.pause();
        song.currentTime = 0;
      	song.play();
			} else if (state === 3) { //back button for level select screen
				state = 0;
			} else if (state === 4) { //back button for settings menu
      	state = 1;
      } else if (state === 5) { //control options
      	advanced = !advanced;
      } else if (state === 6) { //ghostblock option
      	ghostBlocks = !ghostBlocks;
      } else if (state === 7) { //grid option
      	grid = !grid;
      } else if (state === 8) { //DAS option
      	if (DAS === 75) {
          DAS = 100;
        } else {
      	  DAS = (DAS + 50) % 550;
      	  if (DAS === 0) {
      	    DAS = 75;
      	  }
        }
      } else if (state === 9) { //Block palette
    	  palette = (palette + 1) % 5;
    	  tImage.src = tilesets[palette];
      } else if (state === 10) { //adjust music volume
			  musicVolume = (musicVolume + 1) % 11;
			  adjustVolume();
			} else if (state === 11) { //adjust sound effect volume
			  sfxVolume = (sfxVolume + 1) % 11;
			  adjustVolume();
			} else if (state === 12) { //unpause
        state = 111;
      	playing = true;
        time = new Date();
        thread = setInterval(gravity, speeds[level]);
        draw();
        song.play();
      } else if (state === 13) { //quit game
        if (score > highscore[1]) {
  				highscore[1] = score;
  			}
      	if (score === 0) {
          state = 0;
        } else {
      	  state = 51;
      	  nameVals = [0, 0, 0, 0];
        }
        level = 1;
        menu(0);
      } else if (state === 14) { //back to level select from leaderboard
        state = 201;
      } else if (state === 50) { //death screen
        song.pause();
        if (score === 0) {
          state = 0;
        } else {
      	  state = 51;
      	  nameVals = [0, 0, 0, 0];
        }
        level = 1;
        menu(0);
      } else if (state >= 51 && state < 54) { //move sideways through letters
        state++;
      } else if (state === 54) { //go to save button
        state = 56;
      } else if (state === 55) { //back button on initial screen
        state = 0;
      } else if (state === 56) { //save score
        if (score === highscore[1]) {
          highscore[0] = name;
        }
        postHighScores(score, name);
        state = 0;
        getHighScores();
      } else if (state === 201) { //go to leaderboard
        scoreIndex = 0;
        getHighScores();
        state = 140;
      }
      //play sound
      cSound.pause();
      cSound.currentTime = 0;
    	cSound.play();
		}
		if (key === 38) { //up arrow
			if (state === 1 || state === 999) {
				state = 0;
			} else if (state === 201 || state === 200) {
				state = 3;
			} else if (state === 2) {
			  state = 201;
			} else if (state > 4 && state <= 11) {
      	state--;
      } else if (state === 13 || state === 120) {
      	state = 12;
        drawPause();
      } else if (state >= 51 && state <= 54) {
        var numIndex = state - 51;
        nameVals[numIndex]--;
        if (nameVals[numIndex] < 0) {
          nameVals[numIndex] = 27;
        }
      } else if (state === 57) {
        state = 55;
      } else if (state === 56) {
        state = 54;
      } else if (state === 140) {
        if (scoreIndex > 0) {
          scoreIndex -= 10;
        } else {
          state = 14;
        }
      } else if (state === 500) {
        state = 4;
      }
		}		
		if (key === 40) { //down arrow
			if (state === 0 || state === 999) {
				state = 1;
			} else if (state === 201 || state === 200) {
				state = 2;
			} else if (state === 3) {
			   state = 201;
			} else if (state >= 4 && state < 11) {
      	state++;
      } else if (state === 12 || state === 120) {
      	state = 13;
        drawPause();
      } else if (state === 14 || state === 140) {
        if (state === 140 && (scoreArray.length / 2) > scoreIndex + 10) {
          scoreIndex += 10;
        }
        state = 140;
      } else if (state >= 51 && state <= 54) {
        var numIndex = state - 51;
        nameVals[numIndex] = (nameVals[numIndex] + 1) % 28;
      } else if (state === 57) {
        state = 56;
      } else if (state === 55) {
        state = 51;
      } else if (state === 500) {
        state = 5;
      }
		}
		if (key === 37) { //left arrow
		  if (state === 200) {
		    state = 2;
		  }
			if (state === 2 && level > 1) {
				level--;
			}
			if (state === 8) {
			  if (DAS === 75) {
          DAS = 500;
        } else {
      	  DAS -= 50;
      	  if (DAS === 50) {
      	    DAS = 75;
      	  }
        }
			}
			if (state === 9) {
  			palette--;
    	  if (palette < 0) {
    	    palette = 4;
    	  }
    	  tImage.src = tilesets[palette];
			}
			if (state === 10) {
			  musicVolume--;
			  if (musicVolume < 0) {
			    musicVolume = 0;
			  }
			  adjustVolume();
			}
			if (state === 11) {
			  sfxVolume--;
			  if (sfxVolume < 0) {
			    sfxVolume = 0;
			  }
			  adjustVolume();
			}
			if (state > 51 && state <= 54) { //move sideways through letters
		    state--;
		  } else if (state === 51) {
		    state = 55;
		  } else if (state === 56) {
		    state = 54;
		  } else if (state === 57) {
        state = 51;
      } 
		}
		if (key === 39) { //right arrow
		  if (state === 200) {
		    state = 2;
		  }
			if (state === 2 && level < 16) {
				level++;
			}
			if (state === 8) {
			  if (DAS === 75) {
          DAS = 100;
        } else {
    	    DAS = (DAS + 50) % 550;
      	  if (DAS === 0) {
      	    DAS = 75;
      	  }
        }
			}
			if (state === 9) {
  			palette = (palette + 1) % 5;
    	  tImage.src = tilesets[palette];
			}
			if (state === 10) {
			  musicVolume++;
			  if (musicVolume > 10) {
			    musicVolume = 10;
			  }
			  adjustVolume();
			}
			if (state === 11) {
  		  sfxVolume++;
  		  if (sfxVolume > 10) {
    	    sfxVolume = 10;
  		  }
			  adjustVolume();
			}
			if (state >= 51 && state < 54) { //move sideways through letters
		    state++;
		  } else if (state === 54) {
		    state = 56;
		  } else if (state === 55) {
		    state = 51;
		  } else if (state === 57) {
        state = 54;
      } 
		}
		if (key === 27) { //escape
		  if (state === 2 || state === 3 || state === 200) {
		    state = 0;
		  }
		  if ((state >= 4 && state <= 9) || state === 500) {
		    state = 1;
		  }
		}
		if (state >= 51 && state <= 54) {
		  if (key >= 65 && key <= 90) {
		    nameVals[state - 51] = key - 65;
		    if (state < 54) {
		      state++;
		    } else {
		      state = 56;
		    }
		  }
		  if (key === 189) {
		    nameVals[state - 51] = 27;
		    if (state < 54) {
		      state++;
		    } else {
		      state = 56;
		    }
		  }
		  if (key === 190) {
		    nameVals[state - 51] = 26;
		    if (state < 54) {
		      state++;
		    } else {
		      state = 56;
		    }
		  }
		}
	}
	
	if (key === 123) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && key === "I".charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && e.shiftKey && key === "J".charCodeAt(0)) {
    return false;
  }
  if (e.ctrlKey && key === "U".charCodeAt(0)) {
    return false;
  }
}

document.onkeyup = function(e) {
  e = window.event || e;
  key = e.keyCode;
  e.preventDefault();
	
  //stop rotating
	if ((key === 88 || key === 90) || (!advanced && 38)) {
		rotated = false;
	}
	//stop moving right
	if (key === 39) {
		clearTimeout(moveRight);
		pressedR = false;
	}
  //stop moving left
  if (key === 37) {
		clearTimeout(moveLeft);
		pressedL = false;
	}
	//stop moving down
	if (key === 40) {
	  clearInterval(moveDown);
	  pressedDown = false;
	}
	//stop hard dropping
	if ((key === 38 && advanced) || (key === 32 && !advanced)) {
	  clearTimeout(dropThread);
	  pressedUp = false;
	}
}

//mouse movement
document.getElementById("layer2").onmousemove = function(e) {
  var rect = canvas.getBoundingClientRect();
  var mouseX = Math.round(e.clientX - rect.left);
  var mouseY = Math.round(e.clientY - rect.top);
 
  if (!playing) {
    if (mouseX > 0 && mouseX < 600 && mouseY > 0 && mouseY < 640) {
      if (state === 0 || state === 1 || state === 999) {
        state = 999;
        if (mouseX > 155 && mouseX < 445 && mouseY > 375 && mouseY < 436) {
          state = 0;
        } else if (mouseX > 155 && mouseX < 445 && mouseY > 455 && mouseY < 516) {
          state = 1;
        }
      }
      
      if (state === 2 || state === 3 || state === 201 || state === 200) {
        state = 200;
        if (mouseX > 40 && mouseX < 205 && mouseY > 35 && mouseY < 82) {
          state = 3;
        }
        if (mouseX > 215 && mouseX < 385 && mouseY > 405 && mouseY < 575) {
          state = 2;
        }
        if (mouseX > 165 && mouseX < 435 && mouseY > 82 && mouseY < 127) {
          state = 201;
        }
      }
      
      if ((state >= 4 && state <= 11) || state === 500) {
        state = 500;
        if (mouseX > 40 && mouseX < 205 && mouseY > 35 && mouseY < 83) {
          state = 4;
        }
        if (mouseX > 40 && mouseX < 560 && mouseY > 98 && mouseY < 158) {
          state = 5;
        }
        if (mouseX > 40 && mouseX < 560 && mouseY > 168 && mouseY < 228) {
          state = 6;
        }
        if (mouseX > 40 && mouseX < 560 && mouseY > 238 && mouseY < 298) {
          state = 7;
        }
        if (mouseX > 40 && mouseX < 560 && mouseY > 308 && mouseY < 368) {
          state = 8;
        }
        if (mouseX > 40 && mouseX < 560 && mouseY > 378 && mouseY < 438) {
          state = 9;
        }
        if (mouseX > 40 && mouseX < 560 && mouseY > 448 && mouseY < 508) {
          state = 10;
        }
        if (mouseX > 40 && mouseX < 560 && mouseY > 518 && mouseY < 578) {
          state = 11;
        }
      }
      
      if (state === 12 || state === 13 || state === 120) {
        state = 120;
        if (mouseX > 210 && mouseX < 374 && mouseY > 270 && mouseY < 310) {
          state = 12;
        }
        if (mouseX > 210 && mouseX < 374 && mouseY > 315 && mouseY < 355) {
          state = 13;
        }
        drawPause();
      }
      
      if (state === 14 || state === 140) {
        state = 140;
        if (mouseX > 40 && mouseX < 205 && mouseY > 35 && mouseY < 83) {
          state = 14;
        }
      }
      
      if (state >= 51 && state <= 57) {
        state = 57;
        if (mouseX > 40 && mouseX < 205 && mouseY > 35 && mouseY < 83) {
          state = 55;
        }
        if (mouseX > 150 && mouseX < 450 && mouseY > 488 && mouseY < 536) {
          state = 56;
        }
        for (var i = 0; i < 4; i++) {
          if (mouseX > (100 + (i * 100)) && mouseX < (200 + (i * 100)) && mouseY > 155 && mouseY < 390) {
            state = 51 + i;
          }
        }
      }
    }
  }
}

//mouse clicks
document.getElementById("layer2").onclick = function(e) {
  var rect = canvas.getBoundingClientRect();
  var mouseX = Math.round(e.clientX - rect.left);
  var mouseY = Math.round(e.clientY - rect.top);
  
  if (!playing) {
    if (state === 0) { //level select
			state = 200;
			getHighScores()
		} else if (state === 1) { //options
    	state = 500;
    } else if (state === 2) { //start the game
			clearTimeout(menuThread);
			reset();
			multiplier = 1.0 + (0.2 * (level - 1));
			linesRemaining = levelLines[level];
      draw();
			thread = setInterval(gravity, speeds[level]);
			
			song.pause();
      song.currentTime = 0;
    	song.play();
		} else if (state === 3) { //back button for level select screen
			state = 999;
		} else if (state === 4) { //back button for settings menu
    	state = 1;
    } else if (state === 5) { //control options
    	advanced = !advanced;
    } else if (state === 6) { //ghostblock option
    	ghostBlocks = !ghostBlocks;
    } else if (state === 7) { //grid option
    	grid = !grid;
    } else if (state === 8) { //DAS option
      if (DAS === 75) {
        DAS = 100;
      } else {
    	  DAS = (DAS + 50) % 550;
    	  if (DAS === 0) {
    	    DAS = 75;
    	  }
      }
    } else if (state === 9) { //Block palette
    	palette = (palette + 1) % 5;
    	tImage.src = tilesets[palette];
    } else if (state === 10) { //adjust music volume
      musicVolume = (musicVolume + 1) % 11;
      adjustVolume();
		} else if (state === 11) { //adjust sound effects volume
      sfxVolume = (sfxVolume + 1) % 11;
      adjustVolume();
		} else if (state === 12) { //unpause
      state = 111;
      playing = true;
      time = new Date();
      thread = setInterval(gravity, speeds[level]);
      draw();
      song.play();
    } else if (state === 13) { //quit game
      if (score > highscore[1]) {
				highscore[1] = score;
			}
	    if (score === 0) {
        state = 999;
      } else {
        state = 51;
        nameVals = [0, 0, 0, 0];
      }
      level = 1;
      menu(0);
    } else if (state === 14) {
      state = 3;
    } else if (state === 50) { //death screen
      song.pause();
    	if (score === 0) {
        state = 999;
      } else {
        state = 51;
        nameVals = [0, 0, 0, 0];
      }
      level = 1;
      menu(0);
    } else if (state >= 51 && state <= 54) {
      for (var i = 0; i < 4; i++) {
        if (mouseX > (100 + (i * 100)) && mouseX < (200 + (i * 100)) && mouseY > 155 && mouseY < 255) {
          nameVals[i]--;
          if (nameVals[i] < 0) {
            nameVals[i] = 27;
          } 
        }
        if (mouseX > (100 + (i * 100)) && mouseX < (200 + (i * 100)) && mouseY > 290 && mouseY < 390) {
          nameVals[i] = (nameVals[i] + 1) % 28;
        }
      }
    } else if (state === 55) { //back button on initial screen
      state = 0;
    } else if (state === 56) { //save score
      if (score === highscore[1]) {
        highscore[0] = name;
      }
      postHighScores(score, name);
      state = 0;
      getHighScores();
    } else if (state === 14 || state === 140) {
      if (((scoreArray.length / 2) > scoreIndex + 10) && mouseX > 380 && mouseX < 420 && mouseY > 580 && mouseY < 620) {
        scoreIndex += 10;
      }
      if (scoreIndex > 0 && mouseX > 180 && mouseX < 230 && mouseY > 580 && mouseY < 620) {
        scoreIndex -= 10;
      }
    } else if (state === 200) {
      if (mouseX > 440 && mouseX < 485 && mouseY > 360 && mouseY < 400) {
        if (level < 16) {
				  level++;
        }
      }
      if (mouseX > 115 && mouseX < 160 && mouseY > 360 && mouseY < 400) {
        if (level > 1) {
				  level--;
        }
      }
    } else if (state === 201) { //go to leaderboard
      scoreIndex = 0;
      getHighScores();
      state = 140;
    }
    //play sound
    cSound.pause();
    cSound.currentTime = 0;
    cSound.play();
  }
}

flashLayer.onselectstart = function (e) {
  return false;
}

window.onresize = function(e) {
  if (anticheat) {
    if (Math.abs(window.outerWidth - window.innerWidth) > 100) {
      if (!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
        while (true) {
          alert("No cheating allowed 😄");
        }
      }
    }
  }
}

//create array of top 6 scores or 5 and local score
function getHighScores() {  
  $.get("http://tetris-scores.herokuapp.com/", function(response) {    
    scoreArray = response.split(" ");
    scoreArray.splice(scoreArray.length - 1, 1);
    
    //sort the list
    scoreArray = quickSort(scoreArray, 1, scoreArray.length - 1);
    
    topScores = [];
    topNames = [];
    topNums = [];
        
    var max = 6;
    if (scoreArray.length < 12) {
      max = scoreArray.length / 2;
    }
    for (var k = 0; k < max; k++) {
      topScores.push(parseInt(scoreArray[(k * 2) + 1]));
      topNames.push(scoreArray[k * 2]);
      topNums.push(k + 1);
    }
    
    //add local to high scores list
    if (highscore[0] !== "" && highscore[1] < topScores[topScores.length - 1]) {
      for (var l = 1; l < scoreArray.length; l += 2) {
        if (parseInt(scoreArray[l]) === highscore[1] && scoreArray[l - 1] === highscore[0]) {
          var index = ((l - 1) / 2) + 1;
          topScores[topScores.length - 1] = highscore[1];
          topNames[topNames.length - 1] = highscore[0];
          topNums[topNums.length - 1] = index; 
          return;
        }
      }
    }
  });
}

function postHighScores(pScore, pName) {
  var str = pName + " " + pScore;
  $.post("http://tetris-scores.herokuapp.com/", {string: str}, function(response) {
    console.log(response);  
  });
}

function quickSort(arr, left, right) {
  var len = arr.length;
  var pivot;
  var partitionIndex;

  if (left < right) {
    pivot = right;
    partitionIndex = partition(arr, pivot, left, right);
    
    quickSort(arr, left, partitionIndex - 2);
    quickSort(arr, partitionIndex + 2, right);
  }
  return arr;
}

function partition(arr, pivot, left, right) {
  var pivotValue = parseInt(arr[pivot]);
  var partitionIndex = left;
  
  for (var i = left; i < right; i += 2) {
    if (parseInt(arr[i]) > pivotValue){
      swap(arr, i, partitionIndex);
      partitionIndex += 2;
    }
  }
  swap(arr, right, partitionIndex);
  return partitionIndex;
}

function swap(arr, i, j) {
  var tempScore = arr[i];
  var tempName = arr[i - 1];
  arr[i] = arr[j];
  scoreArray[i - 1] = arr[j - 1];
  arr[j] = tempScore;
  arr[j - 1] = tempName;
}

//define the tetriminos
var I = [
	[
		[0,0,0,0],
		[1,1,1,1],
		[0,0,0,0],
		[0,0,0,0]
	], [
		[0,0,1,0],
		[0,0,1,0],
		[0,0,1,0],
		[0,0,1,0]
	], [
		[0,0,0,0],
		[0,0,0,0],
		[1,1,1,1],
		[0,0,0,0]
	], [
		[0,1,0,0],
		[0,1,0,0],
		[0,1,0,0],
		[0,1,0,0]
	]
];

var J = [
  [
    [2,0,0,0],
		[2,2,2,0],
		[0,0,0,0],
		[0,0,0,0]
  ], [
    [0,2,2,0],
		[0,2,0,0],
		[0,2,0,0],
		[0,0,0,0]
  ], [
    [0,0,0,0],
		[2,2,2,0],
		[0,0,2,0],
		[0,0,0,0]
  ], [
    [0,2,0,0],
		[0,2,0,0],
		[2,2,0,0],
		[0,0,0,0]
  ]
];

var L = [
	[
  	[0,0,3,0],
		[3,3,3,0],
		[0,0,0,0],
		[0,0,0,0]
  ], [
  	[0,3,0,0],
		[0,3,0,0],
		[0,3,3,0],
		[0,0,0,0]
  ], [
  	[0,0,0,0],
		[3,3,3,0],
		[3,0,0,0],
		[0,0,0,0]
  ], [
  	[3,3,0,0],
		[0,3,0,0],
		[0,3,0,0],
		[0,0,0,0]
  ]
];

var O = [
	[
    [0,4,4,0],
    [0,4,4,0],
    [0,0,0,0],
    [0,0,0,0]
  ], [
    [0,4,4,0],
    [0,4,4,0],
    [0,0,0,0],
    [0,0,0,0]
  ], [
    [0,4,4,0],
		[0,4,4,0],
		[0,0,0,0],
		[0,0,0,0]
  ], [
    [0,4,4,0],
		[0,4,4,0],
		[0,0,0,0],
		[0,0,0,0]
  ]
];

var S = [
  [
    [0,5,5,0],
    [5,5,0,0],
    [0,0,0,0],
    [0,0,0,0]
  ], [
    [0,5,0,0],
    [0,5,5,0],
    [0,0,5,0],
    [0,0,0,0]
  ], [
    [0,0,0,0],
    [0,5,5,0],
    [5,5,0,0],
    [0,0,0,0]
  ], [
    [5,0,0,0],
    [5,5,0,0],
    [0,5,0,0],
    [0,0,0,0]
  ]
];

var T = [
  [
    [0,6,0,0],
    [6,6,6,0],
    [0,0,0,0],
    [0,0,0,0]
  ], [
    [0,6,0,0],
    [0,6,6,0],
    [0,6,0,0],
    [0,0,0,0]
  ], [
    [0,0,0,0],
    [6,6,6,0],
    [0,6,0,0],
    [0,0,0,0]
  ], [
    [0,6,0,0],
    [6,6,0,0],
    [0,6,0,0],
    [0,0,0,0]
  ]
];

var Z = [
  [
    [7,7,0,0],
    [0,7,7,0],
    [0,0,0,0],
    [0,0,0,0]
  ], [
    [0,0,7,0],
    [0,7,7,0],
    [0,7,0,0],
    [0,0,0,0]
  ], [
    [0,0,0,0],
    [7,7,0,0],
    [0,7,7,0],
    [0,0,0,0]
  ], [
    [0,7,0,0],
    [7,7,0,0],
		[7,0,0,0],
		[0,0,0,0]
  ]
];

//create images
var tile1 = "./Tile1.png"; //classic block palette
var tile2 = "./Tile2.png"; //borderless block palette
var tile3 = "./Tile3.png"; //solid color block palette
var tile4 = "./Tile4.png"; //gradient block palette
var tile5 = "./Tile5.png"; //gradient block palette
var tilesets = [tile1, tile2, tile3, tile4, tile5];
var tImage = new Image();
tImage.src = tilesets[0];

var backgroundImage = "./Board.png"; //main game background
var bgImage = new Image();
bgImage.src = backgroundImage;

var logoImage = "./Logo.png"; //tetrisn't logo
var lgImage = new Image();
lgImage.src = logoImage;

var menuImage = "./MenuStars.png"; //moving stars for menu
var mImage = new Image();
mImage.src = menuImage;

//create sounds
var hdSound = new Audio("https://vocaroo.com/media_command.php?media=s0vg39gZespf&command=download_wav"); //hard drop
hdSound.volume = 0.06 * sfxVolume;
var mSound = new Audio("https://vocaroo.com/media_command.php?media=s1VUZU7NKb9M&command=download_wav"); //moving
mSound.volume = 0.07 * sfxVolume;
var lcSound = new Audio("https://vocaroo.com/media_command.php?media=s1f3vLqFlEn7&command=download_wav"); //line clear
lcSound.volume = 0.06 * sfxVolume;
var cSound = new Audio("https://vocaroo.com/media_command.php?media=s1Zp1mjqJ1fi&command=download_wav"); //click sound
cSound.volume = 0.06 * sfxVolume;
var song = new Audio("http://feeds.soundcloud.com/stream/620847369-elijah-cirioli-elijahciriolicom-music.mp3"); //Music by James Nicholson
song.volume = 0.1 * musicVolume;
song.loop = true;

var thread;
var menuThread;
var moveRight;
var moveLeft;
var moveDown;
var dropThread;
var pointsThread;

menu(0);
getHighScores();

//catch dev tools
if (anticheat) {
  if (Math.abs(window.outerWidth - window.innerWidth) > 100) {
    if (!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
      while (true) {
        alert("No cheating allowed 😄");
      }
    }
  }
}