// The UI element that handles playing and pausing the audio.
class PlayButton extends Graphics {
  // The size of the button.
  _size = 36;

  // The state of the button.
  _paused = false;

  /*
    Renders the play and pause buttons to the canvas.
    - opacity:Number, the amount button has faded.
  */
  draw(opacity) {
    const x = this._position.x;
    const y = this._position.y;
    const size = this._size;

    noStroke();
    fill(255, 255, 255, opacity);

    // If the audio is paused, the play button is displayed. Otherwise, the pause button is displayed.
    if (this._paused) {
      triangle(this._left, this._top, this._right, y, this._left, this._bottom);
    } else {
      const width = size / 4;
      const cornerRadius = this._cornerRadius;
      rect(x - width, y, width, size, 1);
      rect(x + width, y, width, size, 1);
    }
  }

  // Returns the left side of the button.
  get _left() {
    return this._position.x - this._size / 2;
  }

  // Returns the right side of the button.
  get _right() {
    return this._position.x + this._size / 2;
  }

  // Returns the top of the button.
  get _top() {
    return this._position.y - this._size / 2;
  }

  // Returns the bottom of the button.
  get _bottom() {
    return this._position.y + this._size / 2;
  }

  // If the button has been clicked, the audio is toggled between paused and played.
  handleClick() {
    if (mouseX < this._left) return;
    if (mouseX > this._right) return;
    if (mouseY < this._top) return;
    if (mouseY > this._bottom) return;
    this._paused = !this._paused;
    Audio.toggle();
  }
}
