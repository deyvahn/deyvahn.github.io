//The text that displays in the middle of the screen when no audio file is loaded.
let centerText = null;

// The buttoning for playing and pausing the music.
let playButton = null;

// The progress of the current audio track.
let playBar = null;

// The control knob for panning the audio from left-to-right.
let panControl = null;

// The button that unloads the audio track.
let stopButton = null;

// The flag for whether or not to show the user interface.
let showUI = false;

// The canvas element that runs the sketch.
let canvas = null;

// The text that displays the current time of the audio track in minutes and seconds.
let currentTimeText = null;

// The text that displays the total length of the track.
let durationText = null;

// The font that is used in the user interface.
let font = null;

// The graphics buffer that the lines are drawn to in order to create the trippy effect.
let graphics = null;

// The control for how loud the audio is.
let volumeBar = null;

// The text that shows the volume percentage.
let volumeText = null;

// The fade-in and fade-out of the UI.
let opacity = 0;

// The change in the amount of fade per frame.
const opacityFade = 255 * 0.034;

// A collection of all the lines that are generated in the scene.
const lines = [];

// One of p5.js's built-in functions. Runs before the first frame of the sketch.
function setup() {
  // The visualizer starts by creating a canvas element and a graphics buffer to draw the lines to.
  canvas = createCanvas(windowWidth, windowHeight, P2D);
  graphics = createGraphics(windowWidth, windowHeight, P2D);

  // The canvas is assigned a listener that allows the user to drop files into the browser.
  canvas.drop(fileDropped);

  // The font is loaded in and all the graphical interface elements are created.
  font = loadFont("./assets/fonts/NunitoSans-ExtraLight.ttf");
  createCenterText();
  createPlayButton();
  createPlayBar();
  createPanControl();
  createStopButton();
  createTimeText();
  createVolumeBar();
  createVolumeText();
  rectMode(CENTER);
}

// One of p5.js's built-in functions. Is called once at the start of each frame.
function draw() {
  // By default, the background is black.
  background(0);

  // If the audio is loaded, draw the buffered graphics as an image as well as the user interface elements.
  if (Audio.loaded) {
    // The lines stored in the graphics buffer are drawn as a background image.
    image(graphics, 0, 0, windowWidth, windowHeight);
    drawLines();

    // The background of the UI elements is faded-out so the graphics can still be displayed
    fill(0, 0, 0, opacity / 4);
    rect(windowWidth / 2, windowHeight / 2, windowWidth, windowHeight);

    // Draws all the UI elements and a unified opacity value representing their fade is passed through.
    playButton.draw(opacity);
    playBar.draw(opacity);
    panControl.draw(opacity);
    stopButton.draw(opacity);
    durationText.draw(opacity);
    volumeBar.draw(opacity);
    drawCurrentTimeText(opacity);
    drawVolumeText(opacity);

    // At the end of each frame, the FFT and peak detection are updated and the audio checks to see if it has ended.
    Audio.update();
    Audio.checkForEnd(currentTimeText.value, durationText.value);
  }

  // If the UI is present and there is audio playing, fade it in.
  if (showUI && Audio.loaded) {
    opacity = opacity < 255 ? opacity + opacityFade : 255;
    showUI = Audio.loaded;

    // If the audio is not loaded in, prompt the user to drag a file onto the screen.
  } else if (!Audio.loaded) {
    if (
      centerText.value !==
      "Drag an audio file into the browser to start playing."
    ) {
      centerText.value =
        "Drag an audio file into the browser to start playing.";
    }
    centerText.draw();

    // If the UI is not meant to be shown, fade it out.
  } else if (!showUI) {
    opacity = opacity > 0 ? opacity - opacityFade : 0;
  }
}

// Built-in Processing function that handles keyboard inputs.
function keyReleased() {
  // If the user pressed the Enter key, fade the UI in or out.
  if (keyCode === ENTER) {
    if (Audio.loaded) showUI = !showUI;

    // If the user pressed the Space bar, pause or play the audio.
  } else if (keyCode === 32) {
    if (Audio.loaded) Audio.toggle();

    // If the user presses the shift key, a screenshot is saved.
  } else if (keyCode === SHIFT) {
    saveCanvas(graphics, "drop-radio_screenshot", "png");
  }
}

// Built-in Processing function that checks to see when one of the mouse buttons has been clicked.
function mouseClicked() {
  // If the left mouse button is clicked, check to see what is clicked.
  if (mouseButton === LEFT) {
    //If the UI is present, check to see what is clicked.
    if (opacity > 0) {
      // If the mouse is over the play button, this plays or pauses the music depending on the current state.
      playButton.handleClick();
      // If the stop button was clicked, also clear out the graphics buffer.
      if (stopButton.handleClick()) {
        graphics.clear();
        while (lines.length) {
          lines.pop();
        }
      }
    }
  }
}

// Built-in Processing function for handling when a mouse button is pressed down.
function mousePressed() {
  // If the help mouse button is pressed down, handle all the sliding and rotating functions of each slider or control knob.
  if (mouseButton === LEFT) {
    if (opacity > 0) {
      panControl.clicked = panControl.isOverlapping() && showUI;
      volumeBar.clicked = volumeBar.isOverlapping();
      playBar.clicked = playBar.isOverlapping();
    }
  }
}

// Built-in Processing function that handles when the mouse button is released. Resets all clicked flags and toggle playback position.
function mouseReleased() {
  panControl.clicked = false;
  volumeBar.clicked = false;
  if (playBar.clicked) {
    playBar.handleReleased();
    playBar.clicked = false;
  }
}

/*
 The listener that handles what happens when the user drops an audio file into the sketch.

 - file:p5.File, the file the user dropped in the sketch.
 */
function fileDropped(file) {
  if (file.type === "audio") {
    Audio.setup(file, onAudioLoad, whileAudioLoading);
  }
}

// The listener for when the audio file successfully loads.
function onAudioLoad() {
  // The duration text is set based on the length of the song.
  const duration = Audio.duration;
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration - minutes * 60);
  durationText.value = minutes.toString() + ":" + seconds.toString();

  //The audio visualizer is setup including the FFT and peak detection.
  Audio.peakDetect = new p5.PeakDetect();
  Audio.fft = new p5.FFT();
  Audio.play();

  // The fading and graphics are reset.
  opacity = 0;
  graphics.clear();
  while (lines.length) {
    lines.pop();
  }
}

/*
While the audio file is loading, the center text will display the progress of the upload.

- percentage:Number, the value that represents the upload's progress (0 - 1).
*/
function whileAudioLoading(percentage) {
  centerText.value = (percentage * 100).toString() + "%";
}

// When the window is resized, all the UI elements are moved to new positions.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  playButton.position = createVector(windowWidth / 2, windowHeight * 0.8);
  playBar.position = createVector(windowWidth / 2, windowHeight * 0.9);
  panControl.position = createVector(windowWidth * 0.6, windowHeight * 0.8);
  stopButton.position = createVector(windowWidth * 0.4, windowHeight * 0.8);
  centerText.position = createVector(windowWidth / 2, windowHeight / 2);
  centerText.textBoxWidth = windowWidth * 0.9;
  centerText.textBoxHeight = windowHeight * 0.9;
  currentTimeText.position = createVector(
    windowWidth * 0.05,
    windowHeight * 0.95
  );
  durationText.position = createVector(windowWidth * 0.95, windowHeight * 0.95);
  volumeBar.position = createVector(windowWidth * 0.95, windowHeight * 0.45);
  volumeText.position = createVector(windowWidth * 0.95, windowHeight * 0.7);
}

// Creates the play button.
function createPlayButton() {
  playButton = new PlayButton();
  playButton.position = createVector(windowWidth / 2, windowHeight * 0.8);
}

// Creates the drop information text.
function createCenterText() {
  centerText = new Text();
  centerText.position = createVector(windowWidth / 2, windowHeight / 2);
  centerText.value = "Drag an audio file into the browser to start playing.";
  centerText.font = font;
  centerText.textBoxWidth = windowWidth * 0.9;
  centerText.textBoxHeight = windowHeight * 0.9;
  centerText.fontSize = 64;
}

// Creates the playbar.
function createPlayBar() {
  playBar = new PlayBar();
  playBar.position = createVector(windowWidth / 2, windowHeight * 0.9);
}

// Creates the text that displays the time.
function createTimeText() {
  currentTimeText = new Text();
  currentTimeText.position = createVector(
    windowWidth * 0.05,
    windowHeight * 0.95
  );
  currentTimeText.value = "0:00";
  currentTimeText.font = font;
  currentTimeText.fontSize = 16;

  durationText = new Text();
  durationText.position = createVector(windowWidth * 0.95, windowHeight * 0.95);
  durationText.value = "0:00";
  durationText.font = font;
  durationText.fontSize = 16;
}

// Creates the text below the volume bar.
function createVolumeText() {
  volumeText = new Text();
  volumeText.position = createVector(windowWidth * 0.95, windowHeight * 0.7);
  volumeText.value = "100%";
  volumeText.font = font;
  volumeText.fontSize = 16;
}

// Creates the pan control knob.
function createPanControl() {
  panControl = new PanControl();
  panControl.position = createVector(windowWidth * 0.6, windowHeight * 0.8);
}

// Creates the stop button.
function createStopButton() {
  stopButton = new StopButton();
  stopButton.position = createVector(windowWidth * 0.4, windowHeight * 0.8);
}

// Creates the volume bar.
function createVolumeBar() {
  volumeBar = new VolumeBar();
  volumeBar.position = createVector(windowWidth * 0.95, windowHeight * 0.45);
}

/*
 This displays the volume text and handle converting the volume percent to text.
 - opacity:Number, The amount this element is faded out.
*/
function drawVolumeText(opacity) {
  volumeText.value = Math.floor(Audio.volume * 100).toString() + "%";
  volumeText.draw(opacity);
}

/*
 This displays the current time text and handle converting the seconds to minutes and seconds.
 - opacity:Number, The amount this element is faded out.
*/
function drawCurrentTimeText(opacity) {
  // Since the audio API only hands current time in seconds, the seconds are converted to minutes.
  const currentTime = Audio.currentTime;
  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime - minutes * 60);
  currentTimeText.value =
    minutes.toString() + ":" + ("0" + seconds.toString()).slice(-2);

  // The time is displayed with the fade.
  currentTimeText.draw(opacity);
}

// Displays and adds new lines based on the audio data.
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
