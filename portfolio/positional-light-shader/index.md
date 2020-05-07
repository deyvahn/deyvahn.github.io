# Positional Light Shader

---

<video src="/assets/graphics/positional_lights.mp4"></video>

---

# Background

For the VSFX 755 course, we were tasked with expanding upon a side mask shader provided by the professor. I chose to build on top of that by using each object's world space position to calculate the 2 possible colors on each half-circle. The 2 colors on each component can be blended together and have their heights modified.

---

# Process

---

This project began by implementing the shader itself using Arnold's C++ API. The source code for the shader was written in the `ddDistanceLights.cpp` <a href="https://github.com/deyvahn/positional_shader/blob/master/ddDistanceLights.cpp" target="_blank"><i class="ri-github-fill"></i></a> file and stored a subfolder of the project folder `Arnold_shaders` called `src_c++`. The shader itself was compiled to the `Arnold_shaders` folder.

```bash
cd maya/projects/Arnold_shaders/src_c++/ddDistanceLights.cpp
```

Each of the input parameters that would appear in the UI was defined in the `paramIndex` enum and given their name and default value in `node_parameters`.

```cpp
namespace {
	enum paramIndex {k_light_intensity, k_primary_red_channel, k_primary_green_channel, k_primary_blue_channel, k_secondary_red_channel, k_secondary_green_channel, k_secondary_blue_channel, k_swap_colors, k_height, k_blur};
	};

static const char* mode_labels[] = {"x", "y", "z", NULL};
node_parameters {
    AiParameterFlt("lightIntensity", 20.0f);
	AiParameterEnum("primaryRedChannel", 0, mode_labels);
	AiParameterEnum("primaryGreenChannel", 1, mode_labels);
	AiParameterEnum("primaryBlueChannel", 2, mode_labels);
	AiParameterEnum("secondaryRedChannel", 0, mode_labels);
	AiParameterEnum("secondaryGreenChannel", 1, mode_labels);
	AiParameterEnum("secondaryBlueChannel", 2, mode_labels);
	AiParameterBool("swapColors", 0);
	AiParameterFlt("height", 0.5f);
	AiParameterFlt("blur", 0.5f);
}
```

Once the inputs were defined, the `shader_evaluate` macro was able to use those values.

```cpp
shader_evaluate {

	AtRGB primary_color;
	AtRGB secondary_color;

	int primary_red_channel = AiShaderEvalParamEnum(k_primary_red_channel);
	int primary_green_channel = AiShaderEvalParamEnum(k_primary_green_channel);
	int primary_blue_channel = AiShaderEvalParamEnum(k_primary_blue_channel);

	int secondary_red_channel = AiShaderEvalParamEnum(k_secondary_red_channel);
	int secondary_green_channel = AiShaderEvalParamEnum(k_secondary_green_channel);
	int secondary_blue_channel = AiShaderEvalParamEnum(k_secondary_blue_channel);

	bool swap_colors = AiShaderEvalParamBool(k_swap_colors);

	float blur = AiShaderEvalParamFlt(k_blur);
	float height = AiShaderEvalParamFlt(k_height);

    // shader_evaluate continued...
```

The shader first mapped the `[x,y,z]` coordinates of whatever shape would have the shader applied to it to that shaders `[r,g,b]` channels based on user input. Since these values can be greater than `1`, which would result in that channel being maxed out, only the decimal value of each coordinate is used. If any of the values were negative, they were made positive.

```cpp
// shader_evaluate continued...

    const int X = 0;
    const int Y = 1;
    const int Z = 2;

    float world_x = fmod(sg->P.x, 1);
    float world_y = fmod(sg->P.y, 1);
    float world_z = fmod(sg->P.z, 1);

    switch(primary_red_channel) {
        case X:
            primary_color.r = world_x;
            break;
        case Y:
            primary_color.r = world_y;
            break;
        case Z:
            primary_color.r = world_z;
            break;
    }

    switch(primary_green_channel) {
        case X:
            primary_color.g = world_x;
            break;
        case Y:
            primary_color.g = world_y;
            break;
        case Z:
            primary_color.g = world_z;
            break;
    }

    switch(primary_blue_channel) {
        case X:
            primary_color.b = world_x;
            break;
        case Y:
            primary_color.b = world_y;
            break;
        case Z:
            primary_color.b = world_z;
            break;
    }

    if(primary_color.r < 0) primary_color.r *= -1;
    if(primary_color.g < 0) primary_color.g *= -1;
    if(primary_color.b < 0) primary_color.b *= -1;

    switch(secondary_red_channel) {
        case X:
            secondary_color.r = world_x;
            break;
        case Y:
            secondary_color.r = world_y;
            break;
        case Z:
            secondary_color.r = world_z;
            break;
    }

    switch(secondary_green_channel) {
        case X:
            secondary_color.g = world_x;
            break;
        case Y:
            secondary_color.g = world_y;
            break;
        case Z:
            secondary_color.g = world_z;
            break;
    }

    switch(secondary_blue_channel) {
        case X:
            secondary_color.b = world_x;
            break;
        case Y:
            secondary_color.b = world_y;
            break;
        case Z:
            secondary_color.b = world_z;
            break;
    }

    if(secondary_color.r < 0) secondary_color.r *= -1;
    if(secondary_color.g < 0) secondary_color.g *= -1;
    if(secondary_color.b < 0) secondary_color.b *= -1;

// shader_evaluate continued...
```

The primary and secondary colors were then blurred together based on a `height` and `blur` value passed in by the user.

```cpp
// shader_evaluate continued...

    float half_blur = blur / 2;
    float minimum_height = height - half_blur;
    float maximum_height = height + half_blur;
    float blend = AiSmoothStep(minimum_height, maximum_height, sg->Po.y);

// shader_evaluate continued...
```

The `AtRGB mix(AtRGB first_color, AtRGB second_color, float alpha)` function was provided by our professor, [Malcolm Kesson](https://fundza.com).

```cpp
AtRGB mix(AtRGB first_color, AtRGB second_color, float alpha) {
	return first_color * (1.0f - alpha) + (second_color * alpha);
}
```

Finally, the shader then determined if the normal was front-facing or not. If it was, the primary color was blended with the secondary color and visa versa. The `swap_color` value could be used to change that based on user input.

```cpp
//shader_evaluate continued...

if(sg->N == sg->Nf) {
		if(swap_colors) {
			sg->out.RGB() = mix(secondary_color, primary_color, blend);
		} else {
			sg->out.RGB() = mix(primary_color, secondary_color, blend);
		}
	} else {
		if(swap_colors) {
			sg->out.RGB() = mix(primary_color, secondary_color, blend);
		} else {
			sg->out.RGB() = mix(secondary_color, primary_color, blend);
		}
	}
} // End of shader_evaluate
```

In Maya, the scene was created by make half-circles and converting them to mesh lights.

<a class="image-link" href="/assets/graphics/lights-viewport.PNG" target="_blank">![](/assets/graphics/lights-viewport.PNG)</a>

Each got their own version of the shader with different color values. The `light_intensity` value was then animated to give the scene its life. An `aiAtmosphere` was used so that the scene would have volumetric lighting.

<a class="image-link" href="/assets/graphics/lights-shaders.PNG" target="_blank">![](/assets/graphics/lights-shaders.PNG)</a>

---

# Reflections

There are two primary areas I think I could improve on with this project. The first is that, unlike previous projects in the course, I did not implement any additional algorithms and just expanded upon the assignment with additional content from the course. I did this so I would have enough time to render my project with volumetric lighting but the project now does not have the same level of additional depth that I would have otherwise wanted. I plan to remedy this with the next project in the course.

The second area of improvement would be how I went about placing the half-circles in the scene and animating them. I edited each sphere by hand as well as animated all the `light_intensity` values by hand. As a programmer, I would have easily used Python to more quickly create this setup but I chose the safe option for the sake of the render time. If I have a project like this in the future, I will make sure to use Python with it is more applicable.
