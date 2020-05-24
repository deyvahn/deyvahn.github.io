// The UI element for the bar that controls how loud the audio is.
class VolumeBar extends Graphics {
  // The y position of the circle.
  _circleY = 0;

  // The transparency of the background bar.
  _alpha = 0.618;

  // A flag to determine if the circle is being dragged.
  _clicked = false;

  // The size of the circle.
  _size = 24;

  /*
    Renders the volume bar to the canvas.
    - opacity:Number, the amount of fading.
  */
  draw(opacity) {
    // The interaction is handled before the bar is rendered so the volume is properly updated.
    this._handleInteraction();
    const position = this._position;
    const x = position.x;
    const y = position.y;

    // If the circle is not being moved, the position is mapped to the current volume.
    if (!this.clicked) {
      this._circleY = map(
        Audio.volume,
        0,
        1.0,
        position.y + this.height / 2,
        position.y - this.height / 2
      );
    }

    // The circle and the bar are then rendered.
    noStroke();
    fill(255, 255, 255, map(opacity, 0, 255, 0, this.alpha));
    rect(x, y, 6, this.height);
    fill(255, 255, 255, opacity);
    circle(x, this._circleY, this._size);
  }

  // Returns the height of the volume bar relative to the window's height.
  get height() {
    return windowHeight * 0.4;
  }

  // Returns the transparency of the background bar.
  get alpha() {
    return 255 * this._alpha;
  }

  // Sets whether or not this UI element has been clicked.
  set clicked(value) {
    this._clicked = value;
  }

  // Checks if the mouse is overlapping the circle on the bar.
  isOverlapping() {
    return (
      createVector(mouseX, mouseY).dist(
        createVector(this._position.x, this._circleY)
      ) <
      this._size / 2
    );
  }

  // If the circle is being clicked, the user can drag it up and down the bar.
  _handleInteraction() {
    if (mouseButton === LEFT && this._clicked) {
      this._circleY = mouseY;

      // Clamps the y position to the tops and bottoms of the bar.
      if (this._circleY > this._position.y + this.height / 2) {
        this._circleY = this._position.y + this.height / 2;
      } else if (this._circleY < this._position.y - this.height / 2) {
        this._circleY = this._position.y - this.height / 2;
      }

      // Maps the volume to the new location on the slider.
      Audio.volume = map(
        this._circleY,
        this._position.y - this.height / 2,
        this._position.y + this.height / 2,
        1.0,
        0
      );
    }
  }
}
