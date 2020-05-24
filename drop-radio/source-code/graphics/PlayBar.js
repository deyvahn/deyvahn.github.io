// The UI element for the current time and duration of the song being played.
class PlayBar extends Graphics {
  // The x position of the circle that marks the current location in the song.
  _circleX = 0;

  // The transparency of the background bar.
  _alpha = 0.618;

  // The size of the circle on the playbar.
  _size = 24;

  // The flag for whether or not the circle has been clicked.
  _clicked = false;

  // A flag for whether or not the dragging has been handled.
  _interactionHandled = false;

  /*
    Renders the circle and the background bar to the canvas.
    - opacity:Number, the amount of fade.
  */
  draw(opacity) {
    const position = this._position;
    const x = position.x;
    const y = position.y;
    noStroke();

    // The opacity of both the circle and the bar update when the UI is faded in and out.
    fill(255, 255, 255, map(opacity, 0, 255, 0, this.alpha));
    rect(x, y, this.width, 6);
    fill(255, 255, 255, opacity);

    // If the circle hasn't been clicked and the interaction has not yet been complete, map the circle's x position to how far along the song is.
    if (!this._clicked && !this._interactionHandled) {
      this._circleX = map(
        Audio.currentTime,
        0,
        Audio.duration,
        x - this.width / 2,
        x + this.width / 2
      );
    }
    this._interactionHandled = false;
    this._handleInteraction();
    circle(this._circleX, y, this._size);
  }

  // Returns the size of the bar based on the width of the screen.
  get width() {
    return windowWidth * 0.9;
  }

  // Returns the transparency of the alpha based on the percentage set.
  get alpha() {
    return 255 * this._alpha;
  }

  // Returns whether or not the circle has been clicked.
  get clicked() {
    return this._clicked;
  }

  // Sets the clicked state.
  set clicked(value) {
    this._clicked = value;
  }

  // Returns if the mouse is overlapping the circle.
  isOverlapping() {
    return (
      createVector(mouseX, mouseY).dist(
        createVector(this._circleX, this._position.y)
      ) <
      this._size / 2
    );
  }

  // Handles the dragging of the circle across the play bar.
  _handleInteraction() {
    if (mouseButton === LEFT && this._clicked) {
      this._circleX = mouseX;

      // Clamps the x value of the circle between the ends of the bar.
      if (this._circleX > this._position.x + this.width / 2) {
        this._circleX = this._position.x + this.width / 2;
      } else if (this._circleX < this._position.x - this.width / 2) {
        this._circleX = this._position.x - this.width / 2;
      }
    }
  }

  // Handles what happens after the circle has been clicked then released.
  handleReleased() {
    // Skips the audio relative to where the circle was released on the bar.
    Audio.jump(
      map(
        this._circleX,
        this._position.x - this.width / 2,
        this._position.x + this.width / 2,
        0,
        Audio.duration
      )
    );
    this._interactionHandled = true;
  }
}
