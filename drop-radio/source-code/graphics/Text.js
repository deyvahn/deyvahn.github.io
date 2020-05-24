// A wrapper for the text drawing API from p5.
class Text extends Graphics {
  // The string of the text.
  value = "";

  // The size of the text.
  fontSize = 32;

  // The font of the text.
  font = null;

  // The color of the text.
  color = color(255, 255, 255);

  // The alignment of the text.
  _horizontalAlignment = CENTER;
  _verticalAlignment = CENTER;

  // The size of the textbox.
  textBoxWidth = 100;
  textBoxHeight = 100;

  /*
    Renders the text to the canvas.
    - opacity:Number, The amount the text has faded.
  */
  draw(opacity) {
    // All the properties are set before the text is drawn.
    this.color.setAlpha(opacity);
    fill(this.color);
    textAlign(this._horizontalAlignment, this._verticalAlignment);
    textSize(this.fontSize);
    textFont(this.font);

    // The text is then transformed and rendered.
    push();
    translate(this._position.x, this._position.y);
    scale(this.scale);
    rotate(this.rotation);
    text(this.value, 0, 0, this.textBoxWidth, this.textBoxHeight);
    pop();
  }
}
