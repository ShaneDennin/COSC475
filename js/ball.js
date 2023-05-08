
let obj; // used for debugging in web-browser console
let MainModelMat = glMatrix.mat4.create();
let ModelMaterialsArray = []; // an array of materials
let ModelAttributeArray = []; // vertices, normals, textcoords, uv
let indexCounts = [];

// VIEW MATRIX - Camera (view matrix)
let cam = new Camera();

let cottageBuffer = null;


function parse(jObj){
    MainModelMat = glMatrix.mat4.fromValues( // get main model matrix (applied to all children)
        jObj.rootnode.transformation[0],
        jObj.rootnode.transformation[1],
        jObj.rootnode.transformation[2],
        jObj.rootnode.transformation[3],
        jObj.rootnode.transformation[4],
        jObj.rootnode.transformation[5],
        jObj.rootnode.transformation[6],
        jObj.rootnode.transformation[7],
        jObj.rootnode.transformation[8],
        jObj.rootnode.transformation[9],
        jObj.rootnode.transformation[10],
        jObj.rootnode.transformation[11],
        jObj.rootnode.transformation[12],
        jObj.rootnode.transformation[13],
        jObj.rootnode.transformation[14],
        jObj.rootnode.transformation[15]);
    for(let child of jObj.rootnode.children){ // iterate through children
        let mesh = jObj.meshes[child.meshes[0]];
        let modelObj = {}; // vertices, normals, tangents, bitangents, texturecoords, faces
        modelObj.vertices = mesh.vertices;
        modelObj.normals = mesh.normals;
        modelObj.tangents = mesh.tangents;
        modelObj.bitangents = mesh.bitangents;
        modelObj.texturecoords = mesh.texturecoords;
        modelObj.faces = mesh.faces;
        modelObj.modelMat = glMatrix.mat4.fromValues(
            child.transformation[0],
            child.transformation[1],
            child.transformation[2],
            child.transformation[3],
            child.transformation[4],
            child.transformation[5],
            child.transformation[6],
            child.transformation[7],
            child.transformation[8],
            child.transformation[9],
            child.transformation[10],
            child.transformation[11],
            child.transformation[12],
            child.transformation[13],
            child.transformation[14],
            child.transformation[15]);

        let mat = {}; // shading, ambient, diffuse, specular, shininess, opacity, refration, imageSource
        let materialProps = jObj.materials[mesh.materialindex].properties;
        for(let property of materialProps){
            if(property.key == "$mat.shadingm") mat.shadingm = property.value;
            if(property.key == "$clr.ambient") mat.shadingm = property.value;
            if(property.key == "$clr.diffuse") mat.diffuse = property.value;
            if(property.key == "$clr.specular") mat.specular = property.value;
            if(property.key == "$mat.shininess") mat.shininess = property.value;
            if(property.key == "$mat.opacity") mat.opacity = property.value;
            if(property.key == "$mat.refracti") mat.refracti = property.value;
            if(property.key == "$tex.file") mat.imgSrc = "./texture/" + property.value;
        }
        
        ModelAttributeArray.push(modelObj);
        ModelMaterialsArray.push(mat);
    }
}

// we need a function to compile shaders
function createShader(gl, type, source){
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
   
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

// we need a function to link shaders into a program
function createProgram(gl, vertexShader, fragmentShader){
  let  program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
 
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}


function myMain() {
    // uri is relative to directory containing HTML page
    loadExternalJSON('./model/cottage_obj.json');
    // loadExternalJSON('./model/Heli_bell.json');
    // setUpWebGL();
}

function setUpWebGL() {

    // get canvas from DOM (HTML)
    let canvas = document.querySelector("#c");
    /** @type {WebGLRendecylinderContext} */
    let gl = canvas.getContext('webgl2'); 
    let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
    let program = createProgram(gl, vertexShader, fragmentShader);

    // process attribute data from JSON model
    let cottageVertices = [];
    let cottageIndices = [];
    let indexCounts = [];
   
    let indicesOffset = 0;
    for(let k = 0; k<ModelAttributeArray.length; k++){
        for(let i = 0, j =0; i < ModelAttributeArray[k].vertices.length; i += 3, j+=2){ // structures cube vertex data into correct format
            // console.log(ModelAttributeArray[i])
            cottageVertices.push(ModelAttributeArray[k].vertices[i]);
            cottageVertices.push(ModelAttributeArray[k].vertices[i+1]);
            cottageVertices.push(ModelAttributeArray[k].vertices[i+2]);
            cottageVertices.push(ModelAttributeArray[k].normals[i]);
            cottageVertices.push(ModelAttributeArray[k].normals[i+1]);
            cottageVertices.push(ModelAttributeArray[k].normals[i+2]);
            if(ModelAttributeArray[k].texturecoords == undefined){
                cottageVertices.push(0);
                cottageVertices.push(0);
            } else {
                cottageVertices.push(ModelAttributeArray[k].texturecoords[0][j]);
                cottageVertices.push(ModelAttributeArray[k].texturecoords[0][j+1]);
            }

        }

        for(let i=0; i < ModelAttributeArray[k].faces.length; i++){
            cottageIndices.push(ModelAttributeArray[k].faces[i][0] + indicesOffset);
            cottageIndices.push(ModelAttributeArray[k].faces[i][1] + indicesOffset);
            cottageIndices.push(ModelAttributeArray[k].faces[i][2] + indicesOffset);
        }
        indicesOffset += ModelAttributeArray[k].vertices.length/3;
        indexCounts.push(ModelAttributeArray[k].faces.length*3);
    }

    //set up buffers
    //POSITION
    let positionAttributeLocation = gl.getAttribLocation(program, 'vertPosition');
    cottageBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cottageBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cottageVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    let posSize = 3; // get/read 3 components per iteration
    let type = gl.FLOAT; // size in bits for each item
    let normalize = false;  // do not normalize data, generally Never
    let stride = 8 * Float32Array.BYTES_PER_ELEMENT; // 6 floats per vertex (x,y,z, xn,yn,zn ,tx, ty)
    let offset = 0;  // location to start reading data from in the buffer
    gl.vertexAttribPointer(positionAttributeLocation, posSize, type, normalize, stride, offset);
    //NORMALS
    let normalVertAttributeLocation = gl.getAttribLocation(program, 'vertNormal');
    let normalVertSize = 3;
    gl.enableVertexAttribArray(normalVertAttributeLocation);
    let normalVertStride = 8 * Float32Array.BYTES_PER_ELEMENT;
    let normalVertOffset = 3 * Float32Array.BYTES_PER_ELEMENT; // normalVert data starts 6 floats after position
    gl.vertexAttribPointer(normalVertAttributeLocation, normalVertSize, gl.FLOAT, false, normalVertStride, normalVertOffset);
    //TEXTURE
    let texVertAttributeLocation = gl.getAttribLocation(program, 'vertTex');
    let texVertSize = 2;
    gl.enableVertexAttribArray(texVertAttributeLocation);
    let texVertStride = 8 * Float32Array.BYTES_PER_ELEMENT;
    let texVertOffset = 6 * Float32Array.BYTES_PER_ELEMENT; // normalVert data starts 6 floats after position
    gl.vertexAttribPointer(texVertAttributeLocation, texVertSize, gl.FLOAT, false, texVertStride, texVertOffset);

    // INDEX BUFFER
    let indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cottageIndices), gl.STATIC_DRAW);

    //LOAD TEXTURE
    let texture = gl.createTexture();
    let myTexels = new Image();
    let texture2 = gl.createTexture();
    let myTexels2 = new Image();
    // myTexels.src = ModelMaterialsArray[0].imgSrc;
    myTexels.src = "./texture/cottage_diffuse.png";
    // myTexels2.src = ModelMaterialsArray[0].imgSrc;

    let isTexLoaded = false;
    myTexels.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        isTexLoaded = true;
    };

    // myTexels2.onload = function() {
    //     gl.bindTexture(gl.TEXTURE_2D, texture2);
    //     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexels2);
    //     gl.generateMipmap(gl.TEXTURE_2D);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //     isTexLoaded = true;
    // };

    function loadAndApplyTexture(src) {
        isTexLoaded = false;
        let texture = gl.createTexture();
        let myTexels = new Image();
        myTexels.src = src;
    
        myTexels.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        };
    
        return texture;
    }
    

    gl.useProgram(program);
    let totalCount = 0
    for (let i=0; i< indexCounts.length; i++){
        totalCount += indexCounts[i];
    }
    console.log(cottageIndices, cottageVertices, totalCount, indexCounts);

    function animate(){
        gl.clearColor(1, 1, 1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniformMatrix4fv(viewMatrixLocation, false, cam.cameraMatrix);
        floorModel = glMatrix.mat4.create();
        glMatrix.mat4.scale(floorModel, floorModel, [1, 1, 1]);
        glMatrix.mat4.translate(floorModel, floorModel, [0, -1, 0]);
        gl.uniformMatrix4fv(modelLoc, false, floorModel);
        // loadAndApplyTexture("./texture/cottage_diffuse.jpg");
        // gl.drawElements(primtype, indexCounts[0], gl.UNSIGNED_SHORT, 0);
        // gl.drawElements(primtype, totalCount, gl.UNSIGNED_SHORT, 0);
        // gl.drawElements(primtype, indexCounts[1], gl.UNSIGNED_SHORT, indexCounts[0]*Uint16Array.BYTES_PER_ELEMENT);


        floorModel = glMatrix.mat4.create();
        gl.uniformMatrix4fv(modelLoc, false, floorModel);
        // resetTex(ModelMaterialsArray[0].imgSrc);
        // loadAndApplyTexture(ModelMaterialsArray[0].imgSrc);


        if(isTexLoaded){
            let count = 0;
            for(let i=0; i<ModelAttributeArray.length; i++){
                cubeModel = glMatrix.mat4.create();
                glMatrix.mat4.multiply(cubeModel, cubePos, MainModelMat);
                glMatrix.mat4.multiply(cubeModel, cubeModel, ModelAttributeArray[i].modelMat);
                gl.uniformMatrix4fv(modelLoc, false, cubeModel);
                gl.drawElements(primtype, indexCounts[i], gl.UNSIGNED_SHORT, count*Uint16Array.BYTES_PER_ELEMENT);
                count += indexCounts[i];
                // if(i==ModelAttributeArray.length-1){
                //     resetTex("./texture/sand.jpg");
                // } else resetTex(ModelMaterialsArray[i+1].imgSrc);

            }
            
        }

        // myTexels.onload = function() {
        //     gl.bindTexture(gl.TEXTURE_2D, texture);
        //     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
        //     gl.generateMipmap(gl.TEXTURE_2D);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        //     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        //     isTexLoaded = true;
        // };
        requestAnimationFrame(animate);
    }

    // UNIFORMS

    //TEXTURE
    let textureUniformLocation = gl.getUniformLocation(program, 'uTexture');
    
    // MODEL MATRIX
    let modelLoc = gl.getUniformLocation(program, 'modelToWorldMatrix');
    let cubePos = glMatrix.mat4.create()
    cubePos = glMatrix.mat4.fromTranslation(cubePos, [0,0, 0]);

    //PROJECTION MATRIX
    viewMatrixLocation = gl.getUniformLocation(program, 'viewMatrix');
    let projMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projMatrix, Math.PI / 4, 1.4, 0.1, 100.0); /// Projection Matrix
    projLoc = gl.getUniformLocation(program, 'projMatrix');
    gl.uniformMatrix4fv(projLoc, false, projMatrix);

    //AMBIENT LIGHT
    ambientLightColorLoc = gl.getUniformLocation(program, 'ambientLightColor'); // Ambient Light
    // let ambientLightCol = ModelMaterialsArray[0].ambient; 
    let ambientLightCol = [.6,.6,.6];
    gl.uniform3fv(ambientLightColorLoc, ambientLightCol);

    //DIFFUSE LIGHT POSITION 
    let lightPosX = 200;
    let lightPosY= 50;
    let lightPosZ = 200;
    let lightPos = glMatrix.vec3.fromValues(lightPosX,lightPosY,lightPosZ);

    lightPositionLoc = gl.getUniformLocation(program, 'lightPosition'); // Light Direction
    let uLightPos = glMatrix.vec3.create();
    // glMatrix.vec3.add(uLightPos, cubePos, lightPos);
    gl.uniform3fv(lightPositionLoc, lightPos);

    //DIFFUSE LIGHT COLOR
    diffuseLightColorLoc = gl.getUniformLocation(program, 'diffuseLightColor'); // diffuse light color
    let diffuseLightColor = [2.0,2.0,2.0];
    gl.uniform3fv(diffuseLightColorLoc, diffuseLightColor);   

    // MATERIAL COLOR
    materialColorLoc = gl.getUniformLocation(program, 'materialColor');
    let materialColor = [1,1,1];
    gl.uniform3fv(materialColorLoc, materialColor);

    // TEXTURE
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textureUniformLocation, 0);

    gl.enable(gl.DEPTH_TEST);
    let primtype = gl.TRIANGLES;

    window.requestAnimationFrame(animate);
}

function loadExternalJSON(url) {
    fetch(url)
        .then((resp) => {
            // if the fetch does not result in an network error
            if (resp.ok)
                return resp.json(); // return response as JSON
            throw new Error(`Could not get ${url}`);
        })
        .then(function (ModelInJson) {
            // get a reference to JSON mesh model for debug or other purposes 
            obj = ModelInJson;
            // createMaterialsArray(ModelInJson);
            // createModelAttributeArray(ModelInJson);
            parse(ModelInJson);
            if(url=='./model/cottage_obj.json') {
                loadExternalJSON('./model/Heli_bell.json');
            }else {
                // console.log(ModelAttributeArray, ModelMaterialsArray);
                setUpWebGL();
            }
        })
        .catch(function (error) {
            // error retrieving resource put up alerts...
            alert(error);
            console.log(error);
        });
}





    // let cuboid = cube(1);
    // for(let i = 0, j=0; i < cuboid.vertexPositions.length; i += 3, j+=2){ // structures cube vertex data into correct format
    //     cottageVertices.push(cuboid.vertexPositions[i]);
    //     cottageVertices.push(cuboid.vertexPositions[i+1]);
    //     cottageVertices.push(cuboid.vertexPositions[i+2]);
    //     cottageVertices.push(cuboid.vertexNormals[i]);
    //     cottageVertices.push(cuboid.vertexNormals[i+1]);
    //     cottageVertices.push(cuboid.vertexNormals[i+2]);
    //     cottageVertices.push(cuboid.vertexTextureCoords[j]);
    //     cottageVertices.push(cuboid.vertexTextureCoords[j+1]);
    // }
    // for(let i =0; i <cuboid.indices.length; i++){
    //     cottageIndices.push(cuboid.indices[i]);
    // }
    // // indexCounts.push(cuboid.indices.length);
    // let torus = uvTorus(3,2, 12, 12);
    // for(let i = 0, j=0; i < torus.vertexPositions.length; i += 3, j+=2){ // structures cube vertex data into correct format
    //     cottageVertices.push(torus.vertexPositions[i]);
    //     cottageVertices.push(torus.vertexPositions[i+1]);
    //     cottageVertices.push(torus.vertexPositions[i+2]);
    //     cottageVertices.push(torus.vertexNormals[i]);
    //     cottageVertices.push(torus.vertexNormals[i+1]);
    //     cottageVertices.push(torus.vertexNormals[i+2]);
    //     cottageVertices.push(torus.vertexTextureCoords[j]);
    //     cottageVertices.push(torus.vertexTextureCoords[j+1]);
    // }
    // // console.log(torus.indices);
    // for(let i =0; i <torus.indices.length; i++){
    //     cottageIndices.push(torus.indices[i]+cuboid.vertexPositions.length/3);
    //     // cottageIndices.push(torus.indices[i]);

    // }