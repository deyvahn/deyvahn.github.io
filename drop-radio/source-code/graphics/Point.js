// Each end of the lines that make up the visualization aesthetic.
class Point extends Graphics {
  // The speed the point is moving at.
  _velocity = null;

  // The change in the speed of the point over time.
  _acceleration = null;

  // Updates the velocity and position of the points.
  draw() {
    this._velocity.add(this._acceleration);
    this._position.add(this._velocity);
  }

  // Sets the speed at which the point moves. If none is set, one is assigned.
  set velocity(value) {
    if (this._velocity) {
      this._velocity.set(value);
    } else {
      this._velocity = value;
    }
  }

  // Sets the change in speed over time. If none is set, one is assigned.
  set acceleration(value) {
    if (this._acceleration) {
      this._acceleration.set(value);
    } else {
      this._acceleration = value;
    }
  }
}
