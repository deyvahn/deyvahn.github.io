// The wrapper class for the sound.
class Audio {
  // Handles the loading of a new audio file.
  static setup(file, onLoad, whileLoading) {
    if (Audio._file) Audio._file.stop();
    Audio._file = loadSound(file, onLoad, Audio.handleError, whileLoading);
  }

  // Handles checking for if the song is over.
  static checkForEnd(currentTime, duration) {
    if (currentTime === duration) {
      Audio._file = null;
    }
  }

  // Handles any errors during the upload.
  static handleError() {
    Audio._file = null;
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

  // Handles playing and skipping to parts of the audio file.
  static play(seconds = 0) {
    if (seconds > 0) {
      Audio._file.play(seconds);
    } else {
      Audio._file.play();
    }
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

  // Updates the analyzer and peak detection.
  static update() {
    Audio._fft.analyze();
    Audio._peakDetect.update(Audio._fft);
  }

  // Checks if the audio is on a beat.
  static get isPeakDetected() {
    return Audio._peakDetect.isDetected;
  }

  // Sets the private audio analyzer field.
  static set fft(value) {
    Audio._fft = value;
  }

  // Sets the private peak detection field.
  static set peakDetect(value) {
    Audio._peakDetect = value;
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
}
// The audio file itself.
Audio._file = null;

// The loudness value of the audio.
Audio._volume = 1;

// The audio analyzer.
Audio._fft = null;

// The beat analyzer.
Audio._peakDetect = null;
