// The aesthetic effect that is driven by music.
class Line extends Graphics {
  // The first point of the line.
  _pointA = null;

  // The second point of the line.
  _pointB = null;

  // The amount of fading that has taken place.
  _opacity = 1;

  // The two colors of the line. The primary color transitions to the secondary color over time.
  _primaryColor = 0;
  _secondaryColor = 0;

  // The percentage of the interpolation between the primary and secondary colors.
  _color = 0;

  // The thickness of the stroke of the line.
  _strokeWeight = 5;

  // A flag for whether or not the beat has influenced the line.
  _beatInfluenced = false;

  // Picks the primary and secondary colors as well as randomizes some of the line attributes.
  setColors() {
    // If the colors selected are the same, the colors will be selected again.
    const length = Line._colors.length;
    const firstIndex = Math.floor(random(0, length));
    const secondIndex = Math.floor(random(0, length));
    if (firstIndex === secondIndex) {
      this.setColors();
    } else {
      this._primaryColor = color(Line._colors[firstIndex]);
      this._secondaryColor = color(Line._colors[secondIndex]);

      // The opacity, color interpolation and stroke weight are randomized.
      this._opacity = random(0, 1);
      this._color = random(0.01, 0.25);
      this._strokeWeight = random(0, 2);
    }
  }

  /*
    Renders the lines to the graphics buffer.
    - graphics:p5.Element: The graphics buffer the lines are drawn to.
  */
  draw(graphics) {
    /*
    - If a beat is detected and the line has not already been influenced, randomly rotate and scale the line.
    - Otherwise, decrease all the values.
    */
    if (Audio.isPeakDetected && !this._beatInfluenced) {
      this.rotation = random(-PI, PI);
      this.scale = random(1, 1.5);
      this._beatInfluenced = true;
    } else {
      this._strokeWeight =
        this._strokeWeight < 0.001 ? 0.001 : this._strokeWeight * 0.99;
      this.rotation *= 0.99;
      this.scale = this.scale < 1 ? 1 : this.scale * 0.99;
    }

    // Update all the values as they are changed.
    this._primaryColor.setAlpha(lerp(0, 1, this._opacity));
    graphics.strokeWeight(this._strokeWeight);
    graphics.stroke(
      lerpColor(this._primaryColor, this._secondaryColor, this._color)
    );

    //Transforms the line.
    graphics.push();
    graphics.translate(this._pointA.position.x, this._pointA.position.y);
    graphics.rotate(this.rotation);
    graphics.scale(this.scale);
    graphics.line(
      0,
      0,
      this._pointA.position.x - this._pointB.position.x,
      this._pointA.position.y - this._pointB.position.y
    );
    graphics.pop();

    // Each point uses Euler physics and thus needs to be updated once per frame.
    this._pointA.draw();
    this._pointB.draw();

    //The color and opacity values are decreased each frame.
    this._opacity *= 0.99;
    this._color *= 1.01;
    if (this._color > 1) this.color = 1;
  }

  // Returns the first point in the line.
  get pointA() {
    return this._pointA;
  }

  // Returns the second point in the line.
  get pointB() {
    return this._pointB;
  }

  // Returns a random value for the velocity of each point.
  static get speed() {
    return random(0, 0.5);
  }

  // Returns a random number for the acceleration of each point.
  static get acceleration() {
    return random(0, 0.1);
  }

  // When setting the first point in the line, the velocity and acceleration are also set up.
  set pointA(value) {
    this._pointA = value;

    // The velocity has a 50% chance of being positive or negative. The x and y are influenced by the treble and low mids.
    const speedPositive = random(0, 1) > 0.5;
    this._pointA.velocity = createVector(
      map(
        Audio.treble,
        0,
        255,
        speedPositive ? 0 : -Line.speed,
        speedPositive ? Line.speed : 0
      ),
      map(
        Audio.lowMid,
        0,
        255,
        speedPositive ? 0 : -Line.speed,
        speedPositive ? Line.speed : 0
      )
    );

    // The acceleration also has a 50% chance of being positive or negative. The x and y are influenced by high mids and mids.
    const accelerationPositive = random(0, 1) > 0.5;
    this._pointA.acceleration = createVector(
      map(
        Audio.highMid,
        0,
        255,
        accelerationPositive ? 0 : -Line.acceleration,
        accelerationPositive ? Line.acceleration : 0
      ),
      map(
        Audio.mid,
        0,
        255,
        accelerationPositive ? 0 : -Line.acceleration,
        accelerationPositive ? Line.acceleration : 0
      )
    );
  }

  // This is the same as the setter for pointA but with the treble/lowMid and highMid/mid reversed.
  set pointB(value) {
    this._pointB = value;
    this._pointB.velocity = createVector(
      map(Audio.highMid, 0, 255, -Line.speed, Line.speed),
      map(Audio.mid, 0, 255, -Line.speed, Line.speed)
    );
    this._pointB.acceleration = createVector(
      map(Audio.treble, 0, 255, -Line.acceleration, Line.acceleration),
      map(Audio.lowMid, 0, 255, -Line.acceleration, Line.acceleration)
    );
  }

  // Returns the percentage times the full opacity value of 255.
  get opacity() {
    return this._opacity * 255;
  }
}

// This list contains all the possible colors of the lines.
Line._colors = ["Cyan", "Magenta", "Yellow", "Lime"];
