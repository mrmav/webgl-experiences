/* 
 * Game configuration file 
 * mrmav, 2018/09/05 
 */ 

(function () {

    "use strict";

    window.game = window.game || {};
    const game = window.game;
    
    /*
     * Constants
     */

    game.BOARD_WIDTH = 12;
    game.BOARD_HEIGHT = 24;
    game.TILE_SIZE = 32;
    game.TILE_MARGIN = game.TILE_SIZE / 8;
    game.LINE_THICKNESS = 2;
    game.MARGIN_TOP = game.TILE_SIZE * 4;
    game.MARGIN_BOTTOM = game.TILE_SIZE * 2;
    game.MARGIN_RIGHT = game.TILE_SIZE * 2;
    game.MARGIN_LEFT = game.TILE_SIZE * 2;
    game.GAME_SCREEN_WIDTH = game.BOARD_WIDTH * game.TILE_SIZE + game.MARGIN_LEFT + game.MARGIN_RIGHT;
    game.GAME_SCREEN_HEIGHT = game.BOARD_HEIGHT * game.TILE_SIZE + game.MARGIN_TOP + game.MARGIN_BOTTOM;
    game.FONT_SIZE_1 = Math.floor(game.TILE_SIZE * 0.5 / 5) * 5;
    game.FONT_SIZE_2 = Math.floor(game.TILE_SIZE / 5) * 5;
    game.FONT_SIZE_3 = Math.floor(game.TILE_SIZE * 2 / 5) * 5;
    game.SCORE_RECT_WIDTH = game.FONT_SIZE_2 * 6;
    game.SCORE_RECT_HEIGHT = game.FONT_SIZE_2;

    game.MAXIMUM_DROP_INTERVAL = 1000;
    game.MINIMUM_DROP_INTERVAL = 50;
    game.LINES_UNTIL_MAX_INTERVAL = 100;
    game.SCORE_PER_LINE = 100;
    
    game.MENU_STATE = 0;
    game.GAME_STATE = 1;
    game.OPTIONS = 2;
    game.CREDITS = 3;
    game.state = game.MENU_STATE;

    game.vibration = true;
    game.VIBRATION_INTENSITY_1 = 30;
    game.VIBRATION_INTENSITY_2 = 50;
    game.VIBRATION_INTENSITY_3 = 100;
    game.VIBRATION_PAUSE_1 = 30;

    /*
     * Properties for gameplay
     */

    game.lastframe = 0;
    game.lasttime = 0;
    game.startedat = 0;
    game.interval = 0;
    game.counter = 0;
    game.board = [];
    game.currentShape = null;
    game.nextShape = null;
    game.lastFrame = 0;
    game.interval = game.MAXIMUM_DROP_INTERVAL;
    game.spawnNewShape = false;
    game.score = 0;
    game.highscore = 0;
    game.completedLines = 0;
    game.highestCompletedLines = 0;
    game.ellapsedtime = 0;
    game.endGame = false;
    
    game.widthRatio  = 0;
    game.heightRatio = 0;

    game.vibrate = function (pattern) {

        if (this.vibration) {

            navigator.vibrate(pattern);

        }

    }
    
    /*
     * Methods for gameplay
     */

    game.calculateInterval = function () {
        /*
         * https://www.desmos.com/calculator/usvbpvbcdn
         */

        let a = Math.sqrt(this.MAXIMUM_DROP_INTERVAL - this.MINIMUM_DROP_INTERVAL);
        let b = a / this.LINES_UNTIL_MAX_INTERVAL;
        let c = Math.pow((a - (this.completedLines * b)), 2) + this.MINIMUM_DROP_INTERVAL;
        return c;


    }

    game.spawnShape = function (type) {

        type = type || "SHAPE_" + game.utils.randomInt(1, 7);

        this.currentShape = this.nextShape;

        this.nextShape = new game.shape(type);

        this.nextShape.position.x = Math.floor(this.BOARD_WIDTH / 2) - 2;
        this.nextShape.position.y = -this.currentShape.marginUp;

        this.currentShape.position.x = Math.floor(this.BOARD_WIDTH / 2) - 2;
        this.currentShape.position.y = -this.currentShape.marginUp;

        this.spawnNewShape = false;

        if (this.checkOverlap()) {

            this.endGame = true;

        }

    }

    game.update = function (time) {

        if (!this.endGame) {

            if (performance.now() > game.lastFrame + game.interval) {

                // check collisions
                let collisions = game.checkAdjacent();

                // if there are collisions in the bottom
                if (game.utils.checkArrayElementExists(collisions, "bottom")) {

                    this.spawnNewShape = true;

                } else {

                    this.spawnNewShape = false;

                }

                if (this.spawnNewShape) {

                    game.transferShapeToBoard();

                    this.spawnShape();

                    //return;

                }

                // automatic movement
                this.currentShape.moveDown();

                game.lastFrame = performance.now();

            }

            game.checkCompleteLines();

        } else {

            // end game
            // set highscore
            if (game.storage.available) {

                if (game.score > game.highscore) {

                    game.highscore = game.score;

                    window.localStorage.setItem("score", game.highscore);

                }

                if (game.completedLines > game.highestCompletedLines) {

                    game.highestCompletedLines = game.completedLines;

                    window.localStorage.setItem("lines", game.highestCompletedLines);


                }


            }


            game.state = game.MENU_STATE;            

        }

    }

    game.checkAdjacent = function (matrixRotation) {

        let result = [];
        let rotation = matrixRotation || this.currentShape.rotation;
        let matrixShape = game.shapes[this.currentShape.type].rotations[rotation];

        // start looping where the shape begins:
        for (var i = this.currentShape.position.y, ii = 0; i < this.currentShape.position.y + 4; i++ , ii++) {

            for (var j = this.currentShape.position.x, jj = 0; j < this.currentShape.position.x + 4; j++ , jj++) {

                if (matrixShape[ii][jj] === 1) {

                    // if it is the floor
                    if (i >= this.BOARD_HEIGHT - 1) {

                        result.push("bottom");

                    } else if (this.board[i + 1][j] != 0) {

                        result.push("bottom");

                    }

                    // ooor if there is something to the left:
                    if (this.board[i][j - 1] != 0) {

                        result.push("left");

                    }

                    // ooooooor if there is something to the right:
                    if (this.board[i][j + 1] != 0) {

                        result.push("right");

                    }

                }

            }

        }

        return result;

    }

    game.checkOverlap = function (matrixRotation) {

        var rotation = matrixRotation || this.currentShape.rotation;
        var matrixShape = game.shapes[this.currentShape.type].rotations[rotation];

        // start looping where the shape begins:
        for (var i = this.currentShape.position.y, ii = 0; i < this.currentShape.position.y + 4; i++ , ii++) {

            for (var j = this.currentShape.position.x, jj = 0; j < this.currentShape.position.x + 4; j++ , jj++) {

                if (matrixShape[ii][jj] === 1) {

                    if (i >= this.board.length || j >= this.board[0].length) {

                        // fail safe.
                        // this means that we found a block in this piece
                        // that was out of bounds. therefore, no rotation is allowed
                        
                        return true;

                    }

                    if (this.board[i][j] != 0) {

                        // here we found that there is a block in this cell.
                        // we can rotate, because it would cause an overlap.
                        
                        return true;

                    }

                }

            }

        }

        return false;

    }

    game.checkCompleteLines = function () {

        // look up for zeros.
        // if no zeros, it is a score.

        let completeLines = 0;
        let totalScore = 0;

        for (let i = this.BOARD_HEIGHT - 1; i >= 0; i--) {

            if (this.board[i].indexOf(0) < 0) {
                
                // score	
                completeLines++;

                // remove this line
                this.board.splice(i, 1);

                // add another one to the top
                let newLine = new Array(this.BOARD_WIDTH + 1).join('0').split('').map(parseFloat);

                this.board.splice(0, 0, newLine);

            }

        }

        if (completeLines > 0) {

            totalScore = completeLines * 100;
            this.completedLines += completeLines;
            this.score += totalScore;

            let vibrationPattern = [];
            let pause = 30;
            let vib = 50;

            for (let i = 0; i < completeLines; i++) {

                vibrationPattern.push(this.VIBRATION_INTENSITY_2);
                vibrationPattern.push(this.VIBRATION_PAUSE_1);

            }

            this.vibrate(vibrationPattern);

            //this.interval -= this.interval <= game.MINIMUM_DROP_INTERVAL ? 0 : completeLines * 20;
            this.interval = this.calculateInterval();

            console.log(this.calculateInterval())

        }
    }

    game.transferShapeToBoard = function () {

        var matrixShape = game.shapes[this.currentShape.type].rotations[this.currentShape.rotation];

        // start looping where the shape begins:
        for (var i = this.currentShape.position.y, ii = 0; i < this.currentShape.position.y + 4; i++ , ii++) {

            for (var j = this.currentShape.position.x, jj = 0; j < this.currentShape.position.x + 4; j++ , jj++) {

                if (matrixShape[ii][jj] === 1) {

                    this.board[i][j] = game.shapes[this.currentShape.type].color;

                }

            }

        }

    }

    game.handleRightMoveEvent = function () {

        if (!game.utils.checkArrayElementExists(game.checkAdjacent(), "right")) {

            if (this.currentShape.position.x + 4 - this.currentShape.marginRight < game.BOARD_WIDTH) {  // 4 is the number of the shape width

                this.currentShape.moveRight();
                
            }

        }

    }

    game.handleLeftMoveEvent = function () {

        if (!game.utils.checkArrayElementExists(game.checkAdjacent(), "left")) {

            if (this.currentShape.position.x + this.currentShape.marginLeft > 0) {

                this.currentShape.moveLeft();
                
            }

        }

    }

    game.handleDownMoveEvent = function () {

        if (!game.utils.checkArrayElementExists(game.checkAdjacent(), "bottom")) {

            this.currentShape.moveDown();

            this.score++;

            game.lastFrame = performance.now();  // should be its own variable, like lastDownInput eg.

        }

    }

    game.handleThrowDownEvent = function () {

        while (true) {

            if (!game.utils.checkArrayElementExists(game.checkAdjacent(), "bottom")) {

                this.currentShape.moveDown();

                this.score++;

                game.lastFrame = performance.now();  // should be its own variable, like lastDownInput eg.

            } else {

                this.vibrate(50);

                break;

            }

        }

    }

    game.handleThrowLeftEvent = function () {

        while(true) {

            if (!game.utils.checkArrayElementExists(game.checkAdjacent(), "left")) {

                this.currentShape.moveLeft();

            } else {

                this.vibrate(this.VIBRATION_INTENSITY_2);

                break;

            }

        }

    }

    game.handleThrowRightEvent = function () {

        while (true) {

            if (!game.utils.checkArrayElementExists(game.checkAdjacent(), "right")) {

                this.currentShape.moveRight();

            } else {

                this.vibrate(this.VIBRATION_INTENSITY_2);

                break;

            }

        }

    }

    game.handleRotateEvent = function () {

        let nextRotation = this.currentShape.rotation + 1 > 3 ? 0 : this.currentShape.rotation + 1;

        this.currentShape.rotation = nextRotation;
        this.currentShape.calculateMargins();

        // if out of borders, snap it
        if (this.currentShape.position.x + this.currentShape.marginLeft < 0) {

            this.currentShape.position.x = -this.currentShape.marginLeft;

        }
        if (this.currentShape.position.x + 4 - this.currentShape.marginRight > game.BOARD_WIDTH) {

            this.currentShape.position.x = game.BOARD_WIDTH - 4 + this.currentShape.marginRight;

        }

        if (this.checkOverlap()) {

            // roll back rotation
            this.currentShape.rotation = this.currentShape.rotation - 1 < 0 ? 3 : this.currentShape.rotation - 1;

        }

    }

    game.reset = function() {

        game.lastframe = 0;
        game.lasttime = 0;
        game.interval = 0;
        game.counter = 0;
        game.board = [];
        game.currentShape = null;
        game.nextShape = null;
        game.lastFrame = 0;
        game.interval = game.MAXIMUM_DROP_INTERVAL;
        game.spawnNewShape = false;
        game.score = 0;
        game.completedLines = 0;
        game.ellapsedtime = 0;
        game.endGame = false;
        
        for (let i = 0; i < this.BOARD_HEIGHT; i++) {

            let r = [];

            for (let j = 0; j < this.BOARD_WIDTH; j++) {

                r.push(0);

            }

            this.board.push(r);

        }

        // create a first shape
        this.nextShape = new game.shape("SHAPE_" + this.utils.randomInt(1, 7));
        this.spawnShape();

        game.startedat = performance.now();
              

    }

    /*
     * resize the canvas by scaling
     * ans maintain aspect
     * see: http://codetheory.in/scaling-your-html5-canvas-to-fit-different-viewports-or-resolutions/
     */ 
    game.resize = function () {

        // Our canvas must cover full height of screen
        // regardless of the resolution
        var height = window.innerHeight;
        var width = height * (game.gl.canvas.width / game.gl.canvas.height);

        if (width > window.innerWidth) {

            width = window.innerWidth;
            height = width * (game.gl.canvas.height / game.gl.canvas.width);

        }

        game.widthRatio = game.gl.canvas.width / width;
        game.heightRatio = game.gl.canvas.height / height;

        game.gl.canvas.style.width = width + 'px';
        game.gl.canvas.style.height = height + 'px';

        //game.gl.viewport(0, 0, game.gl.canvas.width, game.gl.canvas.height);
        //game.projection = game.m4.ortho(-game.gl.canvas.width / 2, game.gl.canvas.width / 2, game.gl.canvas.height / 2, -game.gl.canvas.height / 2, -1, 1);
        //game.m4.translate(game.projection, game.cameraPosition, game.projection);

    }

    window.addEventListener("resize", game.resize);
        
}());