// The UI element that unloads the audio.
class StopButton extends Graphics {
  // The size of the button.
  _size = 24;

  /*
    Renders the button to the canvas.
    - opacity:Number, the amount of fade on the button.
  */
  draw(opacity) {
    fill(255, 255, 255, opacity);
    const size = this._size;
    rect(this._position.x, this._position.y, size, size);
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

  // If the button has been clicked, the audio is unloaded.
  handleClick() {
    if (mouseX < this._left) return false;
    if (mouseX > this._right) return false;
    if (mouseY < this._top) return false;
    if (mouseY > this._bottom) return false;

    Audio.stop();
    return true;
  }
}
