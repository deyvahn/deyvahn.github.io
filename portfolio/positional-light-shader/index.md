# Positional Light Shader

---

# Background

For the VSFX 755 course, we were tasked with expanding upon a side mask shader provided by the professor. I chose to build on top of that by using each object's world space position to calculate the 2 possible colors on each half-circle. The 2 colors on each component can be blended together and have their heights modified.

---

# Process

---

This project began by implementing the shader itself using Arnold's C++ API. The source code for the shader was written in the `ddDistanceLights.cpp` file and stored a project folder called `INSERT NAME HERE`.

Each of the input parameters that would appear in the UI was defined in the `INSERT NAME HERE`.

```cpp

```

Once the inputs were defined, the `shader_evaluate` macro was able to use those values.

```cpp

```

The shader first mapped the `[x,y,z]` coordinates of whatever shape would have the shader applied to it. Since these values can be greater than `1`, which would result in that channel being maxed out, only the decimal value of each coordinate is used. If any of the values were negative, they were made positive.

```cpp

```

Finally, the shader then determined if the normal was front-facing or not. If it was, the primary color was blended with the secondary color and visa versa. The `swap_color` value could be used to change that based on user input.

```cpp

```

In Maya, the scene was created by make half-circles and converting them to mesh lights.

Each got their own version of the shader with different color values. The `light_intensity` value was then animated to give the scene its life. An `aiAtmosphere` was used so that the scene would have volumetric lighting.

---

# Reflections

There are two primary areas I think I could improve on with this project. The first is that, unlike previous projects in the course, I did not implement any additional algorithms and just expanded upon the assignment with additional content from the course. I did this so I would have enough time to render my project with volumetric lighting but the project now does not have the same level of additional depth that I would have otherwise wanted. I plan to remedy this with the next project in the course.

The second area of improvement would be how I went about placing the half-circles in the scene and animating them. I edited each sphere by hand as well as animated all the `light_intensity` values by hand. As a programmer, I would have easily used Python to more quickly create this setup but I chose the safe option for the sake of the render time. If I have a project like this in the future, I will make sure to use Python with it is more applicable.
