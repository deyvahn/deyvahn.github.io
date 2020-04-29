# Cashflow Classic

---

<a class="image-link" href="/assets/graphics/cashflow-splash.png" target="_blank">![](/assets/graphics/cashflow-splash.png)</a>

---

# Note

Due to the proprietary nature of this project, no code samples will be shown. I will go into detail about the aspects of the game I can describe but the scope will be limited.

---

# Background

As a junior developer at YETi CGI, I worked with a small team of developers to port Cashflow Classic, a Flash game for the web, to native web technologies. To accomplish this, we used CreateJS for the graphics and Firebase for the multiplayer functionality.

---

# Process

---

## Handling Lobbies and Multiplayer

Creating lobbies and connect to others in the new Cashflow Classic was done using Google Firebase. Players are able to set up games with up to 6 other players or join others' lobbies.

<a class="image-link" href="/assets/graphics/cashflow-lobbies.png" target="_blank">![](/assets/graphics/cashflow-lobbies.png)</a>

Our Firebase implementation utilized its event-driven functionality to listen to when players join lobbies or when player positions were updated in the game itself.

<a class="image-link" href="/assets/graphics/cashflow-lobby.png" target="_blank">![](/assets/graphics/cashflow-lobby.png)</a>

## The Game Itself

Cashflow Classic starts with each player selecting their dream. On the same card, they are informed as to the job and salary they were randomly assigned. The goal of the game is for players to leave the center of the board, known as the Rat Race, and achieve their dream on the outer board.

The graphics throughout the game were managed by wrapper classes for the CreateJS API. Since we had access to the original graphics of the game and the game was originally made in Flash, using a graphics API that behaved very similarly made the most sense. EaselJS was used to display the graphics and TweenJS was used to move the pieces around the board.

<a class="image-link" href="/assets/graphics/cashflow-classic.png" target="_blank">![](/assets/graphics/cashflow-lobby.png)</a>

In addition to using EaselJS for displaying bitmap-based graphics, we also used HTML for some of the graphical user interface elements including the financial statement. While we could have manually placed text using EaselJS, leveraging HTML element also allowed us to use CSS to create the grid layout much more easily. Additionally, it allowed us to more easily implement scrollable areas since we would have had to implement that manually if we were to use exclusively EaselJS.

<a class="image-link" href="/assets/graphics/cashflow-folder.png" target="_blank">![](/assets/graphics/cashflow-folder.png)</a>
