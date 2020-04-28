# Whiskey on the Rocks

<a class="image-link" href="/assets/graphics/whiskey-banner.png" target="_blank">![](/assets/graphics/whiskey-banner.png)</a>

---

# Background

The goal of this project was to use Maya's Python API and RenderMan's C++ API to procedurally load and place geometry at render-time. After exploring the shaders in RenderMan's Preset Browser and Pixar's Material Packs [1](https://renderman.pixar.com/material-pack-01) and [2](https://renderman.pixar.com/material-pack-02), I was inspired to make a glass of whiskey with the ice on top. Generating ice at render-time also gave me the opportunity to leverage my video game programming background to use axis-aligned bounding box collision detection to prevent the ice from overlapping one another.

---

# Process

---

## Scene Setup

The scene itself consists of a floor, the glass, the whiskey inside of it, an HDRI light and a RenderMan procedural node. The ice was created then exported to a RIB archive so it could be used by the RenderMan procedural plugin later.

<a class="image-link" href="/assets/graphics/whiskey-viewport.PNG" target="_blank">![](/assets/graphics/whiskey-viewport.PNG)</a>

As previously mentioned, I was inspired by the materials Pixar created for RenderMan. The materials used were Frosted Ice, Dirty Glass, Whiskey and Formica Groovy. The HDRI light uses Pixar's Atrium as an environment map which was located in RenderMan's Preset Browser.

<a class="image-link" href="/assets/graphics/pixar-preset-browser.PNG" target="_blank">![](/assets/graphics/pixar-preset-browser.PNG)</a>

## Passing Data from Maya to RenderMan

The first step in the process was to pass the data from Maya to the procedural plugin that tells RenderMan to create the ice. The RenderMan procedural node mentioned previously serves as a pipeline between the two with `size_variance`, `spacing_variance`, `rotation_variance`, `ice_path`,`initial_scale` and `whiskey_shape_name` added as extra attributes. At render-time, these values (except `whiskey_shape_name`) are passed into the `set_data_string.py` <a href="https://github.com/deyvahn/whiskey-on-the-rocks/blob/master/set_data_string.py" target="_blank"><i class="ri-github-fill"></i></a> script.

The `set_data_string.py` was stored in the `python` directory of the `rfm_scripts` folder so that it could be imported and run from within Maya.

<a class="image-link" href="/assets/graphics/set-data-string-path.png" target="_blank">![](/assets/graphics/set-data-string-path.png)</a>

```python
from set_data_string import set_data_string; set_data_string("RenderManProceduralShape");
```

The name of the RenderMan procedural node's shade, `"RenderManProceduralShape"`, was passed through to the `set_data_string` function where the attributes are converted to strings then assigned to the `data` attribute.

```python
def set_data_string(procedural_node_shape_name):
	"""
	This sets the string of the data attribute of the RenderMan procedural node that is then passed into the procedural plugin.
 	Parameters
	----------
	procedural_node_shape_name : str
		The name of the RenderMan procedural node's shape.
	"""

	# Each of the extra attributes added to the RenderMan procedural node's shape are copied as strings.
	size_variance = get_attribute_as_string(procedural_node_shape_name, "size_variance");
	spacing_variance = get_attribute_as_string(procedural_node_shape_name, "spacing_variance");
	rotation_variance = get_attribute_as_string(procedural_node_shape_name, "rotation_variance");
	ice_path = get_attribute_as_string(procedural_node_shape_name, "ice_path");
	initial_scale = get_attribute_as_string(procedural_node_shape_name, "initial_scale");

	# The coordinates for where the ice can be placed are fetched then the total number of them as well as the coordinates themselves are converted to strings.
	surface_coordinates = get_whiskey_surface_coordinates(get_attribute_as_string(procedural_node_shape_name, "whiskey_shape_name"));
	coordinate_count = str(len(surface_coordinates));
	surface_coordinates_string = " ".join(map(str, surface_coordinates));

	# All the previous data is then concatenated together into a string that is then set to the data attribute.
	data_string = create_data_string(size_variance, spacing_variance, rotation_variance, ice_path, initial_scale,coordinate_count, surface_coordinates_string);
	setAttr(procedural_node_shape_name + ".data", data_string, type="string");

```

Two convenience functions, `get_attribute_as_string` and `create_data_string`, were created to copy each extra attribute as a string and concatenate those string respectively.

```python
def get_attribute_as_string(procedural_node_shape_name, attribute_name):
	"""
	This gets the data from the RenderMan procedural node's shape then converts it to a string.
 	Parameters
	----------
	procedural_node_shape_name : str
		The name of the RenderMan procedural node's shape.
	attribute_name : str
		The name of the RenderMan procedural node's shape extra attribute.

	Returns
	-------
	str
		The extra attribute from the RenderMan procedural node's shape as a string.
	"""

	return str(getAttr(procedural_node_shape_name + '.' + attribute_name));

def create_data_string(*attributes):
	"""
	This concatenates the data strings together to form the singular string that is applied to the data attribute.
 	Parameters
	----------
	*attributes : list
		The list of the data strings to be concatenated together.

	Returns
	-------
	str
		The concatenated data string.
	"""

	data_string = "";
	first_string = True;

	for attribute in attributes:

		# If this is the first string to be concatenated, don't add a space to the front of it.
		if (first_string):
			data_string += attribute;
			first_string = False;
		else:
			data_string += " " + attribute;

	return data_string;
```

The name of the whiskey shape was also passed through so that the vertices on top could be copied and converted to strings. The vertices are looped through backwards so that once the ice cubes are being generated they start in the center of the glass rather than the edges.

```python
def get_whiskey_surface_coordinates(shape_name):
	"""
	This gets the coordinates the ice can be created on from the whiskey mesh.

	Parameters
	----------
	shape_name : str
		The name of the whiskey mesh.

	Returns
	-------
	list
		A list of all the vertices where an ice cube can be place.
	"""

	vertices = [];
	shape = listRelatives(shape_name, shapes=True)[0];
	for current_vertex in range(142, 61, -1):
		vertex_string = shape + '.vtx[%d]' % current_vertex;
		vertex_position = pointPosition(vertex_string);
		vertices.extend(vertex_position);
	return vertices;
```

<a class="image-link" href="/assets/graphics/plugin-gui.png" target="_blank">![](/assets/graphics/plugin-gui.png)</a>

## Rendering the Ice

The `PlaceIceProcedure.cpp` <a href="https://github.com/deyvahn/whiskey-on-the-rocks/blob/master/PlaceIceProcedure.cpp" target="_blank"><i class="ri-github-fill"></i></a> script handles the logic that controls how RenderMan handles the ice cubes at render-time. All of the data mentioned previously was passed through to the procedural plugin and stored as an instance of the `IceData` struct.

```cpp
/**
* This struct is defined by the data passed through from the data field of the RenderMan procedural node.
*
* RtFloat size_variance: The variation in the scale of the ice cube.
* RtFloat spacing_variance: The variation in the x and z coordinates of the ice cube.
* std::string ice_path: The absolute path to the ice RIB archive.
* RtFloat initial_scale: The default scale of each ice cube.
* RtInt coordinate_count: The number of coordinates an ice cube can be placed at.
* RtFloat *surface_coordinates: The x, y, z coordinates of the top of the whiskey.
*/
typedef struct {
	RtFloat size_variance;
	RtFloat spacing_variance;
	RtFloat rotation_variance;
	std::string ice_path;
	RtFloat initial_scale;
	RtInt coordinate_count;
	RtFloat *surface_coordinates;
} IceData;
```

The string that the RenderMan procedural node passed through was parsed and each value converted to their proper type. The algorithm for this was originally provided by our professor, [Malcolm Kesson](https://fundza.com), then modified by me to work with this specific project.

```cpp
/**
* Converts the data to their proper data types.
*
* RtString paramStr: The string of the data from the RenderMan procedural node's data attribute.
*
* Returns a pointer to the data for the ice.
*/
RtPointer ConvertParameters(RtString paramStr) {
	// The strtok() function cannot be used on the paramStr directly because
	// it modifies the string.
	long len = strlen(paramStr);

	// We could directly create a copy of the input paramStr as an array and
	// use the strcpy(), string copy, function.
	//char copyStr[len];
	//strcpy(copyStr, paramStr);

	// However, because the paramStr can be very large we allocate memory
	// from the main memory pool (the "heap") and then perform a block
	// copy of the contents of paramStr.
	char *copyStr = (char*)calloc(len + 1, sizeof(char));
	memcpy(copyStr, paramStr, len + 1);

	// Allocate a block of memory to store one instance of SpheresData.
	IceData *dataPtr = (IceData*)calloc(1, sizeof(IceData));

	// Irrespective of how many values are specified by the paramStr we
	// know the first two values will specify the radius of the spheres
	// and the number of coordinates that define their 3D locations.

	char path_characters[512];

	sscanf(copyStr, "%f %f %f %s %f %d", &dataPtr->size_variance, &dataPtr->spacing_variance, &dataPtr->rotation_variance, path_characters, &dataPtr->initial_scale, &dataPtr->coordinate_count);

	std::string path(path_characters);

	std::vector<std::string> paths = getFiles(path);
	dataPtr->ice_path = paths[0];

	// Allocate memory to store an array of coordinates
	RtInt coordinate_count = dataPtr->coordinate_count;
	dataPtr->surface_coordinates = (RtFloat*)calloc(coordinate_count, sizeof(RtFloat));

	char *strPtr = strtok(copyStr, " ");

	for(int deleted_values = 0; deleted_values < 6; deleted_values++) {
		strPtr = strtok(NULL, " ");
	}
	long current_index = 0;
	while(strPtr) {
		// Convert each string to a double precision floating point number
		dataPtr->surface_coordinates[current_index] = strtod(strPtr, NULL);
		current_index++;
		strPtr = strtok(NULL, " "); // grab the next part of copyStr.
		}
	// Don't forget to free the memory that was allocated for the copied text.
	free(copyStr);
	return (RtPointer)dataPtr;
}
```

After the data is pulled from the `IceData` instance, the script then proceeds with placing the ice cube. After it runs, the memory used by the plugin is freed up. Each of the variation values are used with the `rand_between` function provided by our professor.

```cpp
// ----------------------------------------------------
// A RiProcedural required function
// ----------------------------------------------------
RtVoid Subdivide(RtPointer data, RtFloat detail) {

	/// Each value is pulled from the pointer to the instance of the IceData struct.
	RtFloat size_variance = ((IceData*)data)->size_variance;
	RtFloat spacing_variance = ((IceData*)data)->spacing_variance;
	RtFloat rotation_variance = ((IceData*)data)->rotation_variance;
	std::string ice_path = ((IceData*)data)->ice_path;
	RtInt coordinate_count = ((IceData*)data)->coordinate_count;
	RtFloat initial_scale = ((IceData*)data)->initial_scale;
	RtFloat *surface_coordinates =  ((IceData*)data)->surface_coordinates;

	/// This keeps track of the coordinates that already have ice cubes placed there.
	std::vector <RtFloat> other_coordinates;

	for(int current_index = 0; current_index < coordinate_count; current_index += 3) {

			RtFloat x = surface_coordinates[current_index] + randBetween(-spacing_variance, spacing_variance);
			RtFloat y = surface_coordinates[current_index + 1];
			RtFloat z = surface_coordinates[current_index + 2] + randBetween(-spacing_variance, spacing_variance);

			/// Loops until there is a confirmed overlap of ice cubes.
			RtBoolean overlaps_another = false;
			for(int current_other_index = 0; current_other_index < other_coordinates.size(); current_other_index += 3) {
				if(overlaps_another) {
					break;
				}
				RtFloat other_x = other_coordinates[current_other_index];
				RtFloat other_y = other_coordinates[current_other_index + 1];
				RtFloat other_z = other_coordinates[current_other_index + 2];
				overlaps_another = isOverlapping(x, y, z, other_x, other_y, other_z);
			}

			/// If there are no ice cubes at all or there was no overlap, create and place the ice cube as well as keep track of the coordinate where it was placed.
			if(other_coordinates.size() == 0 || !overlaps_another) {

					RiTransformBegin();
					RiTranslate(x,y,z);
					RiRotate(randBetween(-rotation_variance, rotation_variance), randBetween(0, 1), randBetween(0, 1), randBetween(0, 1));
					RiScale(initial_scale + randBetween(0,size_variance), initial_scale + randBetween(0,size_variance), initial_scale + randBetween(0,size_variance));
					RiReadArchiveV(ice_path.c_str(), NULL, 0, NULL, NULL);

					RiTransformEnd();

					other_coordinates.push_back(x);
					other_coordinates.push_back(y);
					other_coordinates.push_back(z);

			}



	}
}

// ----------------------------------------------------
// A RiProcedural required function
// ----------------------------------------------------
RtVoid Free(RtPointer data) {
	free(((IceData*)data)->surface_coordinates);
    free(data);
}

/**
* Picks a random number between 2 values. Provided by Malcolm Kesson.
*
* RtFloat min: The smaller number in the range.
* RtFloat max: The larger number in the range.
*
* Returns a random number betwen the min and max.
*/
RtFloat randBetween(RtFloat min, RtFloat max) {
    return ((RtFloat)rand()/RAND_MAX) * (max - min) + min;
}
```

To prevent the ice cubes from overlapping, the game development algorithm axis-aligned bounding box collision was implemented. This checks to see if the bounding boxes around the ice cubes are overlapping and only the ones that overlap none of the ice cubes are placed.

```cpp
/**
* Checks if the ice cube about to placed would overlap with one that is already placed.
*
* RtFloat x, y, z: The coordinates of the ice cube being placed.
* RtFloat other_x, other_y, other_z: The coordinates of the ice cube that is already placed.
*
* Returns whether or not the ice cubes are overlapping.
*/
RtBoolean isOverlapping(RtFloat x, RtFloat y, RtFloat z, RtFloat other_x, RtFloat other_y, RtFloat other_z) {

	RtFloat distance_to_edge = .25;

	RtFloat minX = x - distance_to_edge;
	RtFloat minY = y - distance_to_edge;
	RtFloat minZ = z - distance_to_edge;

	RtFloat otherMinX = other_x - distance_to_edge;
	RtFloat otherMinY = other_y - distance_to_edge;
	RtFloat otherMinZ = other_z - distance_to_edge;

	RtFloat maxX = x + distance_to_edge;
	RtFloat maxY = y + distance_to_edge;
	RtFloat maxZ = z + distance_to_edge;

	RtFloat otherMaxX = other_x + distance_to_edge;
	RtFloat otherMaxY = other_y + distance_to_edge;
	RtFloat otherMaxZ = other_z + distance_to_edge;

	RtBoolean xOverlaps = (minX <= otherMaxX && maxX >= otherMinX);
	RtBoolean yOverlaps = (minY <= otherMaxY && maxY >= otherMinY);
	RtBoolean zOverlaps = (minZ <= otherMaxZ && maxZ >= otherMinZ);

	return xOverlaps && yOverlaps && zOverlaps;
}
```

## Reflections

Although I learned a lot by working on this project, there are some areas I would like to improve upon. the lighting in the scene, for example, could be greatly improved. While the HDRI map does create a baseline lighting setup for the render, the lack of shadows and caustics on the table make the scene still look somewhat unrealistic. I plan to learn more about lighting and do more practice renders so the results of my code can look more aesthetically pleasing.

While the memory-managing aspects of C++ can be complicated at times, I found that I prefer that programming language over Python. While Python is a great language itself, I find it more frustrating to deal with indentations and vague errors from Maya than I do working with pointers and blocks of memory directly. While my background is video game programming, this was my first opportunity to use C++ in a project and I now see why it is a popular language in the field. This has inspired me to learn Rust which was designed to be as low-level as C++ without many of the issues that come with it. Additionally, I also plan to use C++ or another language of a similar nature for my thesis project in order to maximize performance.
