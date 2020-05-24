// The UI element for controlling the panning of the audio.
class PanControl extends Graphics {
  // The diameter of the circle.
  _size = 36;

  // The flag for whether or not the pan control is clicked.
  _clicked = false;

  // The position of the mouse stored as a vector.
  _mousePosition = null;

  /*
    Renders the pan control to the canvas.
    - opacity:Number, the percentage of fade.
  */
  draw(opacity) {
    // Interactions with the mouse are handled first.
    this._updateMousePosition();
    this._handleInteraction();

    push();
    //Moves the shape to the desired location.
    translate(this._position.x, this._position.y);

    //Rotates the shape.
    rotate(this.rotation);

    //Draws the circular frame and the line from the center to the edge of the circle.
    const size = this._size;
    fill(255, 255, 255, opacity);
    circle(0, 0, size);
    stroke(0, 0, 0, opacity);
    strokeWeight(4);
    line(0, 0, 0, -size / 2);
    pop();
  }

  // A setter for the private flag for whether or not the pan control has been clicked.
  set clicked(value) {
    this._clicked = value;
  }

  // Updates the vector that stores the mouse position. If there is none, it creates one.
  _updateMousePosition() {
    if (this._mousePosition) {
      this._mousePosition.set(mouseX, mouseY);
    } else {
      this._mousePosition = createVector(mouseX, mouseY);
    }
  }

  // Determines whether or not the mouse is over the pan control.
  isOverlapping() {
    return this._mousePosition.dist(this._position) < this._size / 2;
  }

  // If the mouse is over the pan control and clicked, the audio is panned based on the rotation.
  _handleInteraction() {
    if (mouseButton === LEFT && this._clicked) {
      this.rotation = map(
        mouseX,
        this._position.x - this._size,
        this._position.x + this._size,
        -HALF_PI,
        HALF_PI
      );

      Audio.pan = map(this.rotation, -HALF_PI, HALF_PI, -1.0, 1.0);
    }

    if (this.rotation < -HALF_PI) this.rotation = -HALF_PI;
    else if (this.rotation > HALF_PI) this.rotation = HALF_PI;
  }
}
