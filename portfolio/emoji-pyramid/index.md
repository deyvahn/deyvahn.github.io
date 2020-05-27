# Emoji Pyramid

---

<a class="image-link" href="/assets/graphics/render-1.png" target="_blank">![](/assets/graphics/render-1.png)</a>

---

# Background

For this assignment, we were tasked with creating an OSL shader that could load multiple texture files and randomly assign them to shapes within a group. I chose to create a pyramid of emojis with varying skin tones to demonstrate this shader.

---

# Process

---

## Setting up the Project

In order to load in the textures using the scripts mentioned below, a project folder is needed. This is so the python script `create_emojis.py` <a href="https://github.com/deyvahn/emoji-pyramid/blob/master/create_emojis.py" target="_blank"><i class="ri-github-fill"></i></a> that creates the spheres can load the texture files from the `sourceimages` directory. The texture maps were made from the emoji vector files provided by [Twemoji](https://github.com/twitter/twemoji).

```cpp
maya -> projects -> your_project -> sourceimages
```

Additionally, all the image files that are being used need to be converted to `.tx` files. This can be done using the TX Manager found in Arnold's utilities.

<a class="image-link" href="/assets/graphics/tx-manager.png" target="_blank">![](/assets/graphics/tx-manager.png)</a>

## Creating the Pyramid

The `create_emojis` method from inside the previously mentioned script works by building a grid of spheres on the `x` and `z` axises using `row` and `column` respectively. Each time the grid moves up in the `y` axis (`height`), the amount of spheres that define the grid is decreased.

```python
"""
Creates the pyramid of emojis in the scene.

stack:int - The number of rows, columns and vertical layers in the pyramid.
"""
def create_emojis(stack):

    # Each circle that will be an emoji is stored in a list so it can be grouped later.
	emojis = [];

    # For each layer, create a grid of emojis.
	for height in range(0, stack):

        # As the pyramid's vertical layer increases, the number of emojis in it decreases.
		length = stack - height;
		grid_range = range(0, length);

        # Since each emoji grid starts at x = 0 and z = 0, a value is needed to move the center of each layer so they line up with the center of the previous grid.
		offset = .5 * height;

        # For each grid and column in the layer, create an emoji.
		for row in grid_range:
			for column in grid_range:
				emojis.extend(cmds.sphere(r = .5));

                # To make the emojis look like they are sitting on top of each other, the height offset is divided by 1.5.
				cmds.move(row + offset, height - offset/1.5, column + offset);
				cmds.rotate(uniform(0, 360), uniform(0, 360), uniform(0, 360));

    # The emojis are then grouped and assigned a random texture.
	cmds.group(emojis, n = "emojis");
	add_random_textures();
```

Since each grid starts making spheres at `x = 0; z = 0;`, an `offset` value is needed to line up the center of the new grid with the center of the previous grid. Each sphere is also rotated randomly, grouped then assigned a random texture from the `sourceimages` directory.

<a class="image-link" href="/assets/graphics/ui-spheres.png" target="_blank">![](/assets/graphics/ui-spheres.png)</a>

To assign the random texture map, the path to the `.tx` file is assigned as an extra attribute that is pulled from a list of all the `.tx` files inside the `sourceimages` directory. This is done by getting the path to the workspace, appending the string `"sourceimages/"` to the end of it then adding that full path to the name of each file inside the directory after getting the names of each file. From there, `add_map(attrname, paths)` is called with `attrname = "map"` and `paths` being the list of the full paths to each texture (represented as the `texture_names`) list. The `add_map` function is a renamed version of the `add_string` function provided by our professor, [Malcolm Kesson](https://fundza.com).

```python
"""
Adds an extra string attribute to all shapes in a group. In this case, it is used for paths to textures.

attrname:str - The name of the extra attribute.
paths:list - A collection of paths to each texture.
"""
def add_map(attrname, paths):

	# we take care of dealing with the arnold prefix shenanigans
	attrname = 'mtoa_constant_' + attrname

	"""
	Selections will be either be a number of shapes or one or more groups that contain shapes.
	"""
	selections = cmds.ls(sl=True)

    # For each member of the group, get their transform node and add them to the shape list.
	for sel in selections:
		shapes = cmds.listRelatives(sel, s=True)
		# sel is a shape, therefore, does not have shape relatives
		if shapes == None:
			transforms = cmds.listRelatives(sel, children=True);
			shapes = []
			for transform in transforms:
				shapes.extend(cmds.listRelatives(transform, s=True));

        # If there are no shapes, inform the user.
		if len(shapes) == 0 or len(shapes[0]) == 0:
			print('Cannot find a shape to add attribute')
			return

        # For each shape, pick a texture map and assign it to the map extra attribute.
		for shape in shapes:
			path = choice(paths);
			if cmds.attributeQuery(attrname, node=shape, exists=True) == False:
				cmds.addAttr(shape, ln=attrname, sn=attrname, nn=attrname, k=True, dt='string')
			cmds.setAttr(shape + '.' + attrname, path, type="string")

# Adds a random texture from the sourceimages directory to each shape in a group.
def add_random_textures():

    # A path to each .tx file in the sourceimages directory is stored in a list.
	texture_path = cmds.workspace(q = True, rootDirectory = True) + "sourceimages/";
	texture_names = cmds.getFileList(folder = texture_path, filespec='*.tx');

    # To make sure the full path to the texture us correct, the path to the workspace is appended to the front.
    length = len(texture_names);
	for i in range(0, length):
		texture_names[i] = texture_path + texture_names[i];

    # The paths are then assigned to each member of the group.
	add_map("map", texture_names);
```

## From Shader to Emoji

<a class="image-link" href="/assets/graphics/render-2.png" target="_blank">![](/assets/graphics/render-2.png)</a>

`MOOMTexture.osl` <a href="https://github.com/deyvahn/emoji-pyramid/blob/master/MOOMTexture.osl" target="_blank"><i class="ri-github-fill"></i></a> was a shader written to map the random texture file to the shape it is assigned to. The shader takes the map, applies `gamma` to the `r`, `g` and `b` values then sets the `outputRGB` to the corrected colors. This is called linearization and is applied to prevent images from becoming washed out (enable via the `linearize` boolean). The shader itself was written in a project folder called `Arnold_osl` in the subdirectory `src`.

```cpp
maya -> projects -> Arnold_osl -> src
```

```cpp
shader
MOOMTexture(
	// The path to the texture.
	string mapPath = ""
	[[
		string widget = "filename",
		string label = "Image Path"
	]],

	// The color of the shader should the image not be loaded properly.
	color defaultColor = color(1,0,1),

	// Corrects the color by applying a gamma value to it.
	int linearize = 1
	[[
		string widget = "boolean",
		string label = "Linearize"
	]],

	// The value applied to each color during the linearization process.
	float gamma = 2.2,

	// Optional value to blur the texture maps.
	float blur = 0,

	// The output color.
	output color resultRGB = 0
	)
{

	// The map attribute is stored and used as pathValue. It is then used to load the texture.
	string pathValue;
	if(getattribute("map", pathValue)) {
		resultRGB = texture(pathValue, u, flipV ? (1 - v) : v, "blur", blur);

		// If the texture is to be linearized, the gamma is applied to it.
		if(linearize) {
			resultRGB[0] = pow(resultRGB[0], gamma);
			resultRGB[1] = pow(resultRGB[1], gamma);
			resultRGB[2] = pow(resultRGB[2], gamma);
		}

	} else {

		// IF the texture failed to load, a default color is applied.
		resultRGB = defaultColor;
	}
}

```

In HyperShade, the path is passed through from the `aiUserDataString` node to the `mapPath` property of the shader where the `outputRGB` is then passed to the `aiStandardSurface` shader which is then applied to the group of spheres that make up the pyramid.

<a class="image-link" href="/assets/graphics/hypershade.PNG" target="_blank">![](/assets/graphics/hypershade.PNG)</a>

---

# Reflections

One of the things I wish I had time to improve up with this project was improving the rotation of each emoji. Because they are randomly rotated, some have their backs facing away from the camera which makes it difficult to see all the faces. Although I had played around with rotations based on the `row` and `column` values, I was unable to get all the sides working properly prior to the submission deadline. I will work on this over the summer so I can add this to my portfolio.

<a class="image-link" href="/assets/graphics/render-3.png" target="_blank">![](/assets/graphics/render-3.png)</a>

Another area of improvement on this project would be having the skin tones of the emojis being applied at the shader level rather than as being part of the texture. Although I had also experimented with this, I did not have time to get it working the way I wanted it to prior to the submission. This would be a great addition to the project and I will work on it over the summer.
