function setUpWebGL() {
    // get canvas from DOM (HTML)
    let canvas = document.querySelector("#c");
    /** @type {WebGLRenderingContext} */
    let gl = canvas.getContext('webgl2'); 
    let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
    let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
    let program = createProgram(gl, vertexShader, fragmentShader);

    gl.useProgram(program);

    // Create separate buffers for each model
    let modelBuffers = [];
    let cottage = [0,1,2,3,4];
    let heli = [5,6,7,8];

    let indicesOffset = 0;
    let modelVertices = [];
    let modelIndices = [];
    for (let k = 0; k < cottage.length; k++) {
        for(let i = 0, j =0; i < ModelAttributeArray[k].vertices.length; i += 3, j+=2){ // structures cube vertex data into correct format
            // console.log(ModelAttributeArray[i])
            modelVertices.push(ModelAttributeArray[k].vertices[i]);
            modelVertices.push(ModelAttributeArray[k].vertices[i+1]);
            modelVertices.push(ModelAttributeArray[k].vertices[i+2]);
            modelVertices.push(ModelAttributeArray[k].normals[i]);
            modelVertices.push(ModelAttributeArray[k].normals[i+1]);
            modelVertices.push(ModelAttributeArray[k].normals[i+2]);
            if(ModelAttributeArray[k].texturecoords == undefined){
                modelVertices.push(0);
                modelVertices.push(0);
            } else {
                modelVertices.push(ModelAttributeArray[k].texturecoords[0][j]);
                modelVertices.push(ModelAttributeArray[k].texturecoords[0][j+1]);
            }

        }

        for(let i=0; i < ModelAttributeArray[k].faces.length; i++){
            modelIndices.push(ModelAttributeArray[k].faces[i][0] + indicesOffset);
            modelIndices.push(ModelAttributeArray[k].faces[i][1] + indicesOffset);
            modelIndices.push(ModelAttributeArray[k].faces[i][2] + indicesOffset);
        }
        indicesOffset += ModelAttributeArray[k].vertices.length/3;
        indexCounts.push(ModelAttributeArray[k].faces.length*3);

        // Process vertices and indices for the current model
        // ... (same as in your original code)
    
    }
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
    indicesOffset = 0;
    modelVertices = [];
    modelIndices = [];
    for (let k = 0; k < heli.length; k++) {
        for(let i = 0, j =0; i < ModelAttributeArray[k].vertices.length; i += 3, j+=2){ // structures cube vertex data into correct format
            // console.log(ModelAttributeArray[i])
            modelVertices.push(ModelAttributeArray[k].vertices[i]);
            modelVertices.push(ModelAttributeArray[k].vertices[i+1]);
            modelVertices.push(ModelAttributeArray[k].vertices[i+2]);
            modelVertices.push(ModelAttributeArray[k].normals[i]);
            modelVertices.push(ModelAttributeArray[k].normals[i+1]);
            modelVertices.push(ModelAttributeArray[k].normals[i+2]);
            if(ModelAttributeArray[k].texturecoords == undefined){
                modelVertices.push(0);
                modelVertices.push(0);
            } else {
                modelVertices.push(ModelAttributeArray[k].texturecoords[0][j]);
                modelVertices.push(ModelAttributeArray[k].texturecoords[0][j+1]);
            }

        }

        for(let i=0; i < ModelAttributeArray[k].faces.length; i++){
            modelIndices.push(ModelAttributeArray[k].faces[i][0] + indicesOffset);
            modelIndices.push(ModelAttributeArray[k].faces[i][1] + indicesOffset);
            modelIndices.push(ModelAttributeArray[k].faces[i][2] + indicesOffset);
        }
        indicesOffset += ModelAttributeArray[k].vertices.length/3;
        indexCounts.push(ModelAttributeArray[k].faces.length*3);

        // Process vertices and indices for the current model
        // ... (same as in your original code)
    

    }
            // Create vertex buffer
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(modelVertices), gl.STATIC_DRAW);

    // Create index buffer
    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(modelIndices), gl.STATIC_DRAW);

    // Store the buffers and index count for the current model
    modelBuffers.push({
        vertexBuffer: vertexBuffer,
        indexBuffer: indexBuffer,
        indexCount: modelIndices.length
    });

    // Set up attributes and uniforms as before, but don't call gl.vertexAttribPointer yet
    // ...
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

    function animate() {
        gl.clearColor(1, 1, 1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        for (let i = 0; i < modelBuffers.length; i++) {
            let modelBuffer = modelBuffers[i];

            // Bind the vertex buffer and set up the vertex attributes for the current model
            gl.bindBuffer(gl.ARRAY_BUFFER, modelBuffer.vertexBuffer);
            gl.vertexAttribPointer(positionAttributeLocation, posSize, type, normalize, stride, 0);
            gl.vertexAttribPointer(normalVertAttributeLocation, normalVertSize, gl.FLOAT, false, normalVertStride, normalVertOffset);
            gl.vertexAttribPointer(texVertAttributeLocation, texVertSize, gl.FLOAT, false, texVertStride, texVertOffset);

            // Bind the index buffer for the current model
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelBuffer.indexBuffer);

            // Set up uniforms and render the current model
            // ...
            gl.drawElements(primtype, modelBuffer.indexCount, gl.UNSIGNED_SHORT, 0);
        }

        requestAnimationFrame(animate);
    }

    // ...
}
