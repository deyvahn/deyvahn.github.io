# Drop Radio

---

<a class="image-link" href="/assets/graphics/drop-ui.png" target="_blank">![](/assets/graphics/drop-ui.png)</a>

---

# Software

- HTML
- JavaScript
  - p5.js
  - p5.sound.js

---

# Background

As a graduate student at Savannah College of Art and Design, I was tasked with improving on an existing project in the Portfolio course. I chose to redo an [audio visualizer](/portfolio/audio-visualizer/) I made towards the beginning of my graduate education and port it to the web so it could be easily accessed by anyone.

---

# Process

---

# Setting Up Audio

To make the audio data more easily usable across the visualization, an `Audio` class was created to act as a wrapper with a variety of `static` functions, accessors and mutators. Rather than passing around an instance of an `Audio` object, having a single manager of all the data allowed for the graphical and UI elements to be able to influence the audio from a single source.

When an audio file is dragged onto the screen, its loading is handled by `Audio.setup(file)`. Any file that is not an audio file will result in nothing occuring.

```javascript
// sketch.js

/*
    The listener that handles what happens when the user drops an audio file into the sketch.

    - file:p5.File, the file the user dropped in the sketch.
 */
function fileDropped(file) {
  if (file.type === "audio") {
    Audio.setup(file, onAudioLoad, whileAudioLoading);
  }
}
```

```javascript
// Audio.js

/*
    Handles the loading of the audio file.
    - file:p5.File, the audio file being loaded.
    - onLoad:function, the callback for when the file loads.
    - whileLoading:function, the callback for the duration of the files loading.
*/
static setup(file, onLoad, whileLoading) {
    if (Audio._file) Audio._file.stop();
    Audio._file = loadSound(file, onLoad, Audio.handleError, whileLoading);
}
```

For the audio data itself, `static` accessors were created to allow other parts of the visualization to utilize the data. All the data comes from a private `Audio._fft` property which analyzes the audio each frame and the private `Audio._peakDetect` property which listens for when the audio is on a beat.

```javascript
// Audio.js

// Updates the analyzer and peak detection.
static update() {
    Audio._fft.analyze();
    Audio._peakDetect.update(Audio._fft);
}

// Returns the energy level of the treble.
static get treble() {
    return Audio._fft.getEnergy("treble");
}

// Returns the energy level of the high mids.
static get highMid() {
    return Audio._fft.getEnergy("highMid");
}

// Returns the energy level of the mids.
static get mid() {
    return Audio._fft.getEnergy("mid");
}

// Returns the energy level of the low mids.
static get lowMid() {
    return Audio._fft.getEnergy("lowMid");
}

// Returns the energy level of the bass.
static get bass() {
    return Audio._fft.getEnergy("bass");
}

// Checks if the audio is on a beat.
static get isPeakDetected() {
    return Audio._peakDetect.isDetected;
}
```

The `Audio._file` private property is used to handle playback, volume and panning of the audio file.

```javascript
// Audio.js

// Handles playing the audio.
static play() {
    Audio._file.play();
}

// Handles pausing the audio file.
static pause() {
    Audio._file.pause();
}

// If the audio is paused, it plays it and visa versa.
static toggle() {
    if (Audio.isPlaying) {
      Audio._file.pause();
    } else {
      Audio._file.play();
    }
}

// Stops and cleans up the audio file.
static stop() {
    Audio._file.stop();
    Audio._file = null;
}

// Jumps the audio to a new location.
static jump(cueTime) {
    Audio._file.jump(cueTime, Audio.duration - cueTime);
}

// Returns if audio is loaded.
static get loaded() {
    return Audio._file && Audio._file.isLoaded();
}

// Returns the current time of the audio file in seconds.
static get currentTime() {
    return Audio._file && Audio._file.currentTime();
}

// Returns the duration of the audio in seconds.
static get duration() {
    return Audio._file && Audio._file.duration();
}

// Returns whether or not the audio is playing.
static get isPlaying() {
    return Audio._file && Audio._file.isPlaying();
}

// Shifts the audio from left-to-right.
static set pan(value) {
    if (Audio._file) Audio._file.pan(value);
}

// Returns the left-to-right pan from -1 to 1.
static get pan() {
    if (Audio._file) return Audio._file.getPan();
    else return 0;
}

// Sets the loudness of the audio.
static set volume(value) {
    Audio._file.setVolume(value);
    Audio._volume = value;
}

// Returns the loudness of the audio.
static get volume() {
    return Audio._volume;
}
```

## Audio-Driven Line Art

<a class="image-link" href="/assets/graphics/drop-screenshot.png" target="_blank">![](/assets/graphics/drop-screenshot.png)</a>

Whenever a beat is detected, the visualizer creates a number of `Line` instances based on the energy level of `Audio.bass` or `Audio.treble` (whichever is higher). Once the `Line` instance fades out, it is removed from the visualization.

```javascript
// sketch.js

function drawLines() {
  // For each line, draw them. If the opacity of the line is less than 1%, remove the line.
  let length = lines.length;
  for (let i = 0; i < length; i++) {
    const line = lines[i];
    line.draw(graphics);
    if (line.opacity <= 2.55) {
      lines[i] = null;
      lines.splice(i, 1);
      length = lines.length;
    }
  }

  // If there is a beat detected, create new lines.
  if (Audio.isPeakDetected) {
    // The number of lines is driven by the bass or the treble (whichever is higher).
    const bass = Math.floor(map(Audio.bass, 0, 255, 0, 5));
    const treble = Math.floor(map(Audio.treble, 0, 255, 0, 5));
    const usedValue = Audio.treble > Audio.bass ? treble : bass;

    // A position vector is created then shared to lines are created in the same spot.
    const position = createVector(
      random(0, windowWidth),
      random(0, windowHeight)
    );

    // New lines are created based on the intensity of the treble or bass.
    for (let i = 0; i < usedValue; i++) {
      const line = new Line();
      line.pointA = new Point();
      line.pointA.position = createVector(
        position.x + random(0, map(usedValue, 0, 5, 0, 100)),
        position.y + random(0, map(usedValue, 0, 5, 0, 100))
      );
      line.pointB = new Point();
      line.pointB.position = createVector(
        position.x + random(0, map(usedValue, 0, 5, -100, 0)),
        position.y + random(0, map(usedValue, 0, 5, -100, 0))
      );
      line.setColors();
      lines.push(line);
    }
  }
}
```

The `Point` class acts as a wrapper for the `p5.Vector` that also includes `velocity` and `acceleration` data which are influenced by various energy levels of the audio data.

```javascript
// Point.js

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
```

```javascript
// Line.js

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
```

Each new `Line` created is drawn to a graphics buffer (`graphics`). This is so that the background of the UI can be redrawn each frame while the graphics buffer's background is not, allowing for a more trippy artistic effect.

```javascript
// Line.js

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
```

```javascript
// sketch.js

// One of p5.js's built-in functions. Is called once at the start of each frame.
function draw() {
  // By default, the background is black.
  background(0);

  // If the audio is loaded, draw the buffered graphics as an image as well as the user interface elements.
  if (Audio.loaded) {
    // The lines stored in the graphics buffer are drawn as a background image.
    image(graphics, 0, 0, windowWidth, windowHeight);
    drawLines();

    // continued..
```

## The UI Elements

<a class="image-link" href="/assets/graphics/drop-ui-only.png" target="_blank">![](/assets/graphics/drop-ui-only.png)</a>

There are 5 UI elements in the visualization: `PlayBar`, `PanControl`, `PlayButton`, `StopButton` and `VolumeBar`. Each are subclasses of the `Graphics` class which manages the transformation data of each element.

```javascript
//Graphics.js

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
```

If the user clicks on the circle in the `PlayBar`, then can drag-and-drop it to a new location and the song will jump to that location.

```javascript
// PlayBar.js

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
```

The `VolumeBar` works in a very similar manner with the `_circleY` value being mapped to `Audio.volume`.

```javascript
// VolumeBar.js

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
```

The `StopButton` and `PlayButton` both use axis-aligned bounding box collision detection to check if they are being clicked on and performs their functions if they are.

```javascript
// PlayButton.js

// If the button has been clicked, the audio is toggled between paused and played.
  handleClick() {
    if (mouseX < this._left) return;
    if (mouseX > this._right) return;
    if (mouseY < this._top) return;
    if (mouseY > this._bottom) return;
    this._paused = !this._paused;
    Audio.toggle();
  }
```

```javascript
// StopButton.js

// If the button has been clicked, the audio is unloaded.
  handleClick() {
    if (mouseX < this._left) return false;
    if (mouseX > this._right) return false;
    if (mouseY < this._top) return false;
    if (mouseY > this._bottom) return false;

    Audio.stop();
    return true;
  }
```

The `PanControl` also has mouse interaction. By dragging the mouse from left-to-right, the user can control the panning of the audio as well as rotate the knob.

```javascript
// PanControl.js

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
```
