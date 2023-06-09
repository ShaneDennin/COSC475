
let obj; // used for debugging in web-browser console
let MainModelMat = glMatrix.mat4.create();
let ModelMaterialsArray = []; // an array of materials
let ModelAttributeArray = []; // vertices, normals, textcoords, uv
let indexCounts = [];
let modelBuffers = [];

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
    loadExternalJSON('./model/cottage_obj.json');
}

function setUpWebGL() {

    let canvas = document.querySelector("#c");
    /** @type {WebGLRenderingContext} */
    let gl = canvas.getContext('webgl2'); 
    let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
    let program = createProgram(gl, vertexShader, fragmentShader);


    let indexCounts = [];
    let indicesOffset = 0;
    console.log(ModelAttributeArray, ModelMaterialsArray);
    for(let k = 0; k<ModelAttributeArray.length; k++){
        let modelVertices = [];
        let modelIndices = [];
        for(let i = 0, j =0; i < ModelAttributeArray[k].vertices.length; i += 3, j+=2){ // structures cube vertex data into correct format
            modelVertices.push(ModelAttributeArray[k].vertices[i]);
            modelVertices.push(ModelAttributeArray[k].vertices[i+1]);
            modelVertices.push(ModelAttributeArray[k].vertices[i+2]);
            modelVertices.push(ModelAttributeArray[k].normals[i]);
            modelVertices.push(ModelAttributeArray[k].normals[i+1]);
            modelVertices.push(ModelAttributeArray[k].normals[i+2]);
            
            if(ModelAttributeArray[k].texturecoords == undefined || ModelAttributeArray[k].texturecoords.length === 0){
                modelVertices.push(0);
                modelVertices.push(0);
            } else {
                if(i==ModelAttributeArray[k].vertices.length-3) console.log(i,j,k, ModelAttributeArray[k].texturecoords[0][j], ModelAttributeArray[k].texturecoords[0][j+1])
                modelVertices.push(ModelAttributeArray[k].texturecoords[0][j]);
                modelVertices.push(ModelAttributeArray[k].texturecoords[0][j+1]);
            }

        }

        for(let i=0; i < ModelAttributeArray[k].faces.length; i++){
            modelIndices.push(ModelAttributeArray[k].faces[i][0]);
            modelIndices.push(ModelAttributeArray[k].faces[i][1]);
            modelIndices.push(ModelAttributeArray[k].faces[i][2]);
        }
        indexCounts.push(ModelAttributeArray[k].faces.length*3);
        // Create vertex buffer
        let vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelVertices), gl.STATIC_DRAW);

        // Create index buffer
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelIndices), gl.STATIC_DRAW);

        // Store the buffers and index count for the current model
        modelBuffers.push({
            vertexBuffer: vertexBuffer,
            indexBuffer: indexBuffer,
            indexCount: modelIndices.length
        });
    }



    //set up buffers
    //POSITION
    let positionAttributeLocation = gl.getAttribLocation(program, 'vertPosition');
    gl.enableVertexAttribArray(positionAttributeLocation);
    let posSize = 3; // get/read 3 components per iteration
    let type = gl.FLOAT; // size in bits for each item
    let normalize = false;  // do not normalize data, generally Never
    let stride = 8 * Float32Array.BYTES_PER_ELEMENT;
    let offset = 0;  // location to start reading data from in the buffer
    //NORMALS
    let normalVertAttributeLocation = gl.getAttribLocation(program, 'vertNormal');
    let normalVertSize = 3;
    gl.enableVertexAttribArray(normalVertAttributeLocation);
    let normalVertStride = 8 * Float32Array.BYTES_PER_ELEMENT;
    let normalVertOffset = 3 * Float32Array.BYTES_PER_ELEMENT; 
    //TEXTURE
    let texVertAttributeLocation = gl.getAttribLocation(program, 'vertTex');
    let texVertSize = 2;
    let texVertStride = 8 * Float32Array.BYTES_PER_ELEMENT;
    let texVertOffset = 6 * Float32Array.BYTES_PER_ELEMENT; 
    gl.enableVertexAttribArray(texVertAttributeLocation);

    //LOAD TEXTURES
    let texture = gl.createTexture();
    let myTexels = new Image();
    myTexels.src = "./texture/cottage_diffuse.png";
    let texture2 = gl.createTexture();
    let myTexels2 = new Image();
    myTexels2.src = "./texture/metal.jpg";
    let texture3 = gl.createTexture();
    let myTexels3 = new Image();
    myTexels3.src = "./texture/grass.jpg";
    let texture4 = gl.createTexture();
    let myTexels4 = new Image();
    myTexels4.src = "./texture/camo.jpg";

    let isTexLoaded = false;
    let isTexLoaded2 = false;
    let isTexLoaded3 = false;
    let isTexLoaded4 = false;

    myTexels.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        isTexLoaded = true;
    };
    myTexels2.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexels2);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        isTexLoaded2 = true;
    };
    myTexels3.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture3);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexels3);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        isTexLoaded3 = true;
    };
    myTexels4.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture4);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, myTexels4);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        isTexLoaded4 = true;
    };

    gl.useProgram(program);
    console.log(modelBuffers);

    //ANIMATION
    bladeRotation = 0;
    heliRotation1 = 0;
    heliRotation2 = 90;
    cannon1 = 0;
    cannon2 = 0;
    cannon3 = 0;
    cannon4 = 0;
    cannonsDir = 1;
    turret = 0
    turretDir = 1;

    function animate() {
        gl.clearColor(.67, .84, .9, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniformMatrix4fv(viewMatrixLocation, false, cam.cameraMatrix);
        modelM = glMatrix.mat4.create();
        gl.uniformMatrix4fv(modelLoc, false, modelM);
        let materialColor = [1,1,1];
        gl.uniform3fv(materialColorLoc, materialColor);
        gl.enableVertexAttribArray(texVertAttributeLocation);
        gl.bindTexture(gl.TEXTURE_2D, texture3);
        
            for (let i = 0; i < modelBuffers.length; i++) {
                if(isTexLoaded && isTexLoaded2 && isTexLoaded3 && isTexLoaded4){

                let modelBuffer = modelBuffers[i];
                // Bind the vertex buffer and set up the vertex attributes for the current model
                gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer.vertexBuffer);
                gl.vertexAttribPointer(positionAttributeLocation, posSize, type, normalize, stride, 0);
                gl.vertexAttribPointer(normalVertAttributeLocation, normalVertSize, gl.FLOAT, false, normalVertStride, normalVertOffset);
                gl.vertexAttribPointer(texVertAttributeLocation, texVertSize, gl.FLOAT, false, texVertStride, texVertOffset);
                // Bind the index buffer for the current model
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelBuffer.indexBuffer);


                if(i==0){ // GRASS
                    floorModel = glMatrix.mat4.create();
                    floorModel = glMatrix.mat4.create();
                    glMatrix.mat4.scale(floorModel, floorModel, [3, .1, 3]);
                    gl.uniformMatrix4fv(modelLoc, false, floorModel);
                }
                if(i==4){ // COTTAGE
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    floorModel = glMatrix.mat4.create();
                    gl.uniformMatrix4fv(modelLoc, false, floorModel);
                }
                if (i>4 && i<9){ // HELICOPTER
                    gl.bindTexture(gl.TEXTURE_2D, texture4);
                    floorModel = glMatrix.mat4.create();
                    glMatrix.mat4.translate(floorModel, floorModel, [0, 20, 0]);
                    glMatrix.mat4.rotateY(floorModel, floorModel, -.3*heliRotation2++ * Math.PI/180);
                    glMatrix.mat4.translate(floorModel, floorModel, [10, 0,0]);
                    if(i==6) {
                        glMatrix.mat4.translate(floorModel, floorModel,[0, 0, -.7]);
                        glMatrix.mat4.rotateY(floorModel, floorModel, 12*bladeRotation++ * Math.PI/180);
                        glMatrix.mat4.translate(floorModel, floorModel,[0, 0, .7]);
                    }
                    gl.uniformMatrix4fv(modelLoc, false, floorModel);
                }
                if(i==9) { //TURRET
                    gl.bindTexture(gl.TEXTURE_2D, texture2);
                }
                if(i>8){ // TURRET
                    gl.uniform3fv(materialColorLoc, [.2,.2,.2]);
                    floorModel = glMatrix.mat4.create();
                    glMatrix.mat4.translate(floorModel, floorModel, [-30, 1, 10]);
                    glMatrix.mat4.scale(floorModel, floorModel, [.2, .2, .2]);
                    glMatrix.mat4.rotateY(floorModel, floorModel, Math.PI)
                    if(i>9){
                        if(turret>500 || turret<-600){
                            turretDir *= -1;
                        }
                        glMatrix.mat4.rotateY(floorModel, floorModel, .1*turret * Math.PI/180)
                        turret += turretDir;

                    }
                    if(i==13) {
                        glMatrix.mat4.translate(floorModel, floorModel,[-8, 60,0]);
                        if(cannon1>30 || cannon1<-150){
                            cannonsDir *= -1;
                        }
                        glMatrix.mat4.rotateZ(floorModel, floorModel, .5*cannon1 * Math.PI/180);
                        cannon1 += cannonsDir;
                        glMatrix.mat4.translate(floorModel, floorModel,[12, -53,0]);
                    }
                    else if(i==18) {
                        glMatrix.mat4.translate(floorModel, floorModel,[-8, 60,0]);
                        glMatrix.mat4.rotateZ(floorModel, floorModel, .5*cannon2 * Math.PI/180);
                        cannon2 += cannonsDir;
                        glMatrix.mat4.translate(floorModel, floorModel,[12, -60,0]);
                    }
                    else if(i==19) {
                        glMatrix.mat4.translate(floorModel, floorModel,[-10, 55,0]);
                        glMatrix.mat4.rotateZ(floorModel, floorModel, .5*cannon3 * Math.PI/180);
                        cannon3 += cannonsDir;
                        glMatrix.mat4.translate(floorModel, floorModel,[12, -53,0]);
                    }
                    else if(i==17) {
                        glMatrix.mat4.translate(floorModel, floorModel,[-10, 55,0]);
                        glMatrix.mat4.rotateZ(floorModel, floorModel, .5*cannon4 * Math.PI/180);
                        cannon4 += cannonsDir;
                        glMatrix.mat4.translate(floorModel, floorModel,[12, -53,-8]);
                    }
                    gl.uniformMatrix4fv(modelLoc, false, floorModel);
                }
                if(i==20){//PIKACHU
                    gl.disableVertexAttribArray(texVertAttributeLocation);
                    gl.uniform3fv(materialColorLoc, [.7,.7,0]);
                    floorModel = glMatrix.mat4.create();
                    glMatrix.mat4.translate(floorModel, floorModel, [0, 0, 0]);
                    gl.uniformMatrix4fv(modelLoc, false, floorModel);
                }
                
                if(i!=8 && i<21 && i!=16 && i!=1 && i!=2 && i!=3 && i!=12 && i!= 14 && i!= 15 && i!= 16){ // USELESS CHILDREN (Bad models)
                    gl.drawElements(primtype, modelBuffer.indexCount, gl.UNSIGNED_SHORT, 0);
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            }
        }

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
    let ambientLightCol = [.6,.6,.6];
    gl.uniform3fv(ambientLightColorLoc, ambientLightCol);

    //DIFFUSE LIGHT POSITION 
    let lightPosX = 300;
    let lightPosY= 50;
    let lightPosZ = 200;
    let lightPos = glMatrix.vec3.fromValues(lightPosX,lightPosY,lightPosZ);

    lightPositionLoc = gl.getUniformLocation(program, 'lightPosition'); // Light Direction
    let uLightPos = glMatrix.vec3.create();
    gl.uniform3fv(lightPositionLoc, lightPos);

    //DIFFUSE LIGHT COLOR
    diffuseLightColorLoc = gl.getUniformLocation(program, 'diffuseLightColor'); // diffuse light color
    let diffuseLightColor = [1.5,1.5,1.5];
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
            } else if(url=='./model/Heli_bell.json'){
                loadExternalJSON('./model/gunTower.json');
            } else if(url=='./model/gunTower.json'){
                loadExternalJSON('./model/pikachu.json');
            } else setUpWebGL();
        })
        .catch(function (error) {
            // error retrieving resource put up alerts...
            alert(error);
            console.log(error);
        });
}