// The base class for all the renderable objects.
class Graphics {
  // The location of the object.
  _position = null;

  // The scaling of the object.
  scale = 1;

  // The rotation of the object.
  rotation = 0;

  // Returns a copy of the position if it exists, otherwise returns null.
  get position() {
    if (this._position) {
      return this._position.copy();
    } else return this._position;
  }

  // If the position is already a vector, it will be set to the new vector. Otherwise, a new vector is created.
  set position(value) {
    if (this._position) {
      this._position.set(value);
    } else {
      this._position = value;
    }
  }
}
