# Audio Visualizer

<a class="image-link" href="/assets/graphics/audio-visualizer.PNG" target="_blank">![](/assets/graphics/audio-visualizer.PNG)</a>

---

# Background

This was designed and programmed as the final project for the ITGM 719 - Scripting for Interactivity course. The goal was to implement a Processing library of our choice and build an interactive application around that. I chose to use the Minim audio library to drive the shapes in the scene with data from music files.

---

# Process

---

## Handling Audio

I wrapped the Minim library in the `Audio` static class so that the data from the audio itself could be accessed from any other part of the code. Rather than expose the instances of the objects used from the Minim library, the values used by the graphical components of the visualizer are wrapped in accessor functions. This also helped to alleviate any unexpected errors as a result of passing around objects.

The `setup` method was called at the beginning of the program and confirmed whether there were `.mp3` files in the `data` directory. If there were, all the Minim library object needed are instantiated and the audio begins playing.

```java
//Allocates the memory for all the Minim library classes used and sets up basic playback rules.
  //PApplet app is a reference to the application itself. Needed for Minim initalization.
  //String fileName is the name of the audio file to be loaded and played.
  public static boolean setup(PApplet app) {

    //Assigns the application pointer.
    _app = app;

    //Sets up the data path.
    _dataFolder = new File(app.sketchPath() + "\\data");

    //Updates the list of audio files in the data directory.
    updateAudioFiles();

    //If this is the first song, create the order.
    if(_currentSong == 0) shuffle();

    //If there are audio files...
    if(_audioFiles.size() > 0) {

      //Sets up pointers to all audio-related objects.
      _minim = new Minim(app);

      //Loads the file for playback and allocates memory for it.
      _player = _minim.loadFile(_audioFiles.get(_order.get(_currentSong % _order.size())), 2048);

      //Fetches the information about the audio track.
      _data = _player.getMetaData();

      //Gets the buffer of the audio file.
      _mix = _player.mix;

      //Creates object to find where beats happen.
      _beat = new BeatDetect();

      //Sets how many milliseconds between beats will be detected.
      _beat.setSensitivity(5);

      //Plays the song
      _player.play();

      //Flag that the song is not paused.
      _paused = false;

      //Because volume does not work on all platforms, gain is used to control the loudness.
      _player.setGain(_volume);

      return true;
    }

    //If the audio file is not loaded, flag it.
    else return false;
  }
```

## Driving the Graphics

The `Deformer`, `DeformingBar`, `InformationBar`, `Key`, `PanControl`, `Point` and `Text` classes are all implementations of the `Drawable` interface that served as wrappers for Processing's shape drawing methods and their associated data. `Deformer` (which is made up of a series of `Point` instances) and `DeformingBar` are the graphical elements that access the data from the `Audio` static class. The `Deformer` picks random `Point` instances that make up its shape and pushes them out based on the level of the audio and the user-set intensity.

```java
//Display all points on the deformed circle.
  private void drawPoints() {

    //For each point in the collection of points...
    for (Point point : _points) {

      //If the point was selected to be deformed...
      if (point.getExtraDistance() > 0) {

        //Fetch the extra distance.
        int extraDistance = point.getExtraDistance();

        //Fetch the angle of the point relative to the center of the circle.
        float angle = point.getAngle();

        //Add the additional distance to the point's location on the circle.
        float radius = OUTER_RADIUS + extraDistance;

        //Set the position based on the extra distance applied.
        point.setPosition(new PVector(radius * cos(angle), radius * sin(angle)));
      }

      //Display the point.
      point.draw();
    }
  }

  //Calculates the extra distance a point will move based on the audio data.
  private void updateRandomPointPositions() {

    //For each random point in the list of random points.
    for (Point randomPoint : _randomPoints) {

      //Calculate the extra distance based on the audio level. Range is randomized for a more dynamic effect.
      randomPoint.setExtraDistance((int)random(map(Audio.getIntensity(), -50, 50, 10, 100) * Audio.getLevel(), map(Audio.getIntensity(), -50, 50, 100, 1000) * Audio.getLevel()));

      //Fetch the extra distance.
      int extraDistance = randomPoint.getExtraDistance();

      //Fetch the point's angle relative to the center of the circle.
      float angle = randomPoint.getAngle();

      //Add the additional distance to the point's location on the circle.
      float radius = OUTER_RADIUS + extraDistance;

      //Set the position based on the extra distance applied.
      randomPoint.setPosition(new PVector(radius * cos(angle), radius * sin(angle)));
    }
  }

  //Selects the points to be deformed.
  private void chooseRandomPoints() {

    //Calculates the number of affected points. It can be any number between 1 and 1/4 of the total points.
    int numberOfRandomPoints = (int)random(1, LEVEL_OF_DETAIL/4);

    //Create a collection of random points to be added to.
    ArrayList<Point> randomPoints = new ArrayList<Point>();

    //For each number of random points to be deformed...
    for (int i = 0; i < numberOfRandomPoints; i++) {

      //Get a random point from the collection of points.
      Point point = _points.get((int)random(1, LEVEL_OF_DETAIL));

      //If that point has not already been selected to be deformed, then add it to the list of be deformed.
      if (!randomPoints.contains(point)) randomPoints.add(point);
    }

    //Updates the list of random points.
    _randomPoints = randomPoints;
  }
}
```

The `DeformingBar` instances, by contrast, drive their height by whether or not a beat has been detect as well as how intense the audio levels are then fade back to their original size.

```java
  //Returns the height to its original number.
  private void fadeHeight() {
    if (_size.y > MINIMUM_HEIGHT) _size.y *= .99;
    else if (_size.y < MINIMUM_HEIGHT) _size.y = MINIMUM_HEIGHT;
    if (_lerp > 0) _lerp *= .95;
    else _lerp = 0;
  }

  //If the song is on beat, set the height of the bar varied based on the intensity level set up the user and the audio level.
  private void driveHeightWithBeat() {
    if (Audio.getIsOnset()) {
        boolean inRange = _index > _minimumInfluencedIndex && _index < _maximumInfluencedIndex;
        _size.y = MINIMUM_HEIGHT + random(map(Audio.getIntensity(), -50, 50, inRange ? 500 : 100, inRange ? 1000 : 500) * Audio.getLevel(), map(Audio.getIntensity(), -50, 50, inRange ? 1000 : 500, inRange ? 2500 : 1000) * Audio.getLevel());
        _lerp = 1;
    }
  }
```

The other graphical elements serve to provide the user information on what is happening or inputs related to keyboard shortcuts. The `Key` class acts a template for all the clickable buttons in the visualization and using point-to-rectangle collision detection for the hover effect as well as checking if it was clicked on.

```java
//Uses AABB to determine if the box bar of the indicator is being hovered over.
  public boolean mouseIsOverlapping() {

    //Half the width.
    float halfWidth = _size.x/2;

    //Half the height.
    float halfHeight = _size.y/2;

    //Location of the left side in the sketch.
    float left = _position.x - halfWidth;

    //Location of the right side in the sketch.
    float right = _position.x + halfHeight;

    //Location of the top side in the sketch.
    float top = _position.y - halfHeight;

    //Location of the bottom side in the sketch.
    float bottom = _position.y + halfHeight;

    //If the mouse is not inside the box, return false. Otherwise, return true.
    if(mouseX > right) return false;
    else if(mouseX < left) return false;
    else if(mouseY > bottom) return false;
    else if(mouseY < top) return false;
    else return true;

  }
```

The `PanControl` class operates much in the same way, however, it uses point-to-circle collision detection and can be rotated so long as the user holds down the left mouse button.

```java
//Checks if the user is clicking and updates the rotation of the shape and panning of the audio.
  private void handleInteraction() {

    //If the mouse is over the pan control or the user is still holding down the left mouse button...
    if(isOverlapping() || _clickedOn) {

      //Calculate the change in time between frames.
      _deltaTime = (millis() - _previousTime) / 250;

      //Use that to interpolate the fill and stroke.
      _feedbackLerp += _deltaTime;
    }

    //Otherwise...
    else {

      //Fades the interpolation back to normal.
      _feedbackLerp *= .95;
    }

    //If the user clicked on the shape...
    if(mousePressed && mouseButton == LEFT && _clickedOn) {

      //Rotate it between -90 and 90 degrees.
       _rotation = map(mouseX, _position.x - SIZE, _position.x + SIZE, -HALF_PI, HALF_PI);

       //Clamp the rotation between -90 and 90.
       if(_rotation < -HALF_PI) _rotation = -HALF_PI;
       else if(_rotation > HALF_PI) _rotation = HALF_PI;

       //Map the rotate to the left and right values of audio pan.
       Audio.setPan(map(_rotation, -HALF_PI, HALF_PI, -1, 1));
    }
  }
```

# Reflections

The most limiting factor of this project was that it was coded using Processing's Java environment. While the API is useful for quickly iterating on graphics-based projects, it has performance limitations and cannot be run on the web. I plan to port this project to p5.js, Processing's JavaScript equivalent, and also update the graphics so that the project is both more visually-appealing and accessible without needing to download it.
