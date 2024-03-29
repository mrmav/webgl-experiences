/*
 * The game loop
 * mrmav, 2018/09/05
 */
(function () {

    "use strict";

    window.game = window.game || {};
    const game = window.game;

    game.gameloop = function (time) {

        this.ellapsedtime = performance.now() - game.startedat;

        // update and clear viewport        
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // update the score text
        this.text.foreground = "#ffffff";
        this.text.updateTextureText("score", this.utils.convertScoreIntToString(this.score, 6))
        this.text.foreground = "#777777";
        this.text.updateTextureText("timer", this.utils.convertScoreIntToString(Math.floor(this.ellapsedtime * 0.001), 6))

        // render the shadow of the next shape
        this.nextShape.render(this.projection, true);

        // render current falling shape
        this.currentShape.render(this.projection, false);

        // for each board position, render a quad
        // only if the value is 1
        for (let y = 0; y < this.board.length; y++) {

            for (let x = 0; x < this.board[0].length; x++) {

                if (this.board[y][x]) {

                    const model = this.models["modelQuad"];

                    model.x = x * this.TILE_SIZE + this.TILE_SIZE / 2 + this.MARGIN_LEFT;
                    model.y = y * this.TILE_SIZE + this.TILE_SIZE / 2 + this.MARGIN_TOP;
                    model.width  = this.TILE_SIZE - this.TILE_MARGIN;
                    model.height = this.TILE_SIZE - this.TILE_MARGIN;

                    this.models.update(model, this.projection);
                    this.models.render(model);

                }

            }

        }

        // render score quad
        let model = this.models["modelScore"];
        model.x = this.GAME_SCREEN_WIDTH / 2;
        model.y = this.MARGIN_TOP / 4;
        this.models.update(model, this.projection);
        this.models.render(model);

        // render timer quad
        this.models.render(this.models["modelTimer"]);

        // update the play button
        const button = this.buttons["playButton"];
        //this.buttons.renderButton(button);

        // render decorative lines
        this.models["modelPuzzleAreaLines"].uniforms.u_worldViewProjection = this.projection;
        this.models["modelGameAreaLines"].uniforms.u_worldViewProjection = this.projection;

        this.models.render(this.models["modelPuzzleAreaLines"]);
        this.models.render(this.models["modelGameAreaLines"]);

        // update the logic. Yap, with the render loop.
        // this is a puzzle game man...
        this.update(time);

    }

}());