class Camera{
    
    /**
     * Initialize member variables and create
     */
    cameraMatrix;
    constructor(){
        // our lookAt matrix
        this.cameraMatrix = glMatrix.mat4.create();

        // lookAt Point. where camera is pointing. Initially looking down
        // -Z-axis
        this.viewDirectionVector = glMatrix.vec3.fromValues(0.0, 0.0, -1.0);

        // our default up vector always <0, 1, 0>
        this.upVector = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);

        // or the eye vector. position of camera
        this.positionVector = glMatrix.vec3.fromValues(-10.0, 10, 70.0);

        // amount we scale movement by
        this.delta = 1;
        this.updateCameraMatrix();
    }
    /*
    * moves a delta in direction of viewDirectionVector
    * creats a vector that is in direction of viewDirectionVector and scale-by delta
    * adds this vector to the viewDirectionVector and recomputes lookAt matrix
    */
    moveForward(){
        let temp = glMatrix.vec3.create();
        glMatrix.vec3.copy(temp, this.viewDirectionVector);
        glMatrix.vec3.scale(temp, temp, this.delta);
        glMatrix.vec3.add(this.positionVector, this.positionVector, temp);
        this.updateCameraMatrix()
    }
    moveBackward(){
        let temp = glMatrix.vec3.create();
        glMatrix.vec3.copy(temp, this.viewDirectionVector);
        glMatrix.vec3.scale(temp, temp, this.delta);
        glMatrix.vec3.subtract(this.positionVector, this.positionVector, temp);    
        this.updateCameraMatrix()
    }
    strafeLeft(){
        let temp = glMatrix.vec3.create();
        glMatrix.vec3.cross(temp, this.viewDirectionVector, this.upVector);
        glMatrix.vec3.scale(temp, temp, this.delta);
        glMatrix.vec3.subtract(this.positionVector, this.positionVector, temp);   
        this.updateCameraMatrix()

    //let newPosition = glMatrix.v
    }
    strafeRight(){
        let temp = glMatrix.vec3.create();
        glMatrix.vec3.cross(temp, this.viewDirectionVector, this.upVector);
        glMatrix.vec3.scale(temp, temp, this.delta);
        glMatrix.vec3.add(this.positionVector, this.positionVector, temp);           
        this.updateCameraMatrix()
    }
    rotateLeft() {
        const quatRot = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(quatRot, this.upVector, 4 * Math.PI / 180);
        glMatrix.vec3.transformQuat(this.viewDirectionVector, this.viewDirectionVector, quatRot);
        this.updateCameraMatrix();
    }

    rotateRight() {
        const quatRot = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(quatRot, this.upVector, -4 * Math.PI / 180);
        glMatrix.vec3.transformQuat(this.viewDirectionVector, this.viewDirectionVector, quatRot);
        this.updateCameraMatrix();
    }

    rotateUp() {
        const rotationAxis = glMatrix.vec3.create();
        glMatrix.vec3.cross(rotationAxis, this.viewDirectionVector, this.upVector);
        const quatRot = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(quatRot, rotationAxis, 4 * Math.PI / 180);
        glMatrix.vec3.transformQuat(this.viewDirectionVector, this.viewDirectionVector, quatRot);
        this.updateCameraMatrix();
    }

    rotateDown() {
        const rotationAxis = glMatrix.vec3.create();
        glMatrix.vec3.cross(rotationAxis, this.viewDirectionVector, this.upVector);
        const quatRot = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(quatRot, rotationAxis, -4 * Math.PI / 180);
        glMatrix.vec3.transformQuat(this.viewDirectionVector, this.viewDirectionVector, quatRot);
        this.updateCameraMatrix();
    }
    pedestalUp(){
        let temp = glMatrix.vec3.create();
        glMatrix.vec3.copy(temp, this.upVector);
        glMatrix.vec3.scale(temp, temp, this.delta);
        glMatrix.vec3.add(this.positionVector, this.positionVector, temp);   
        this.updateCameraMatrix()
    }
    pedestalDown(){
        let temp = glMatrix.vec3.create();
        glMatrix.vec3.copy(temp, this.upVector);
        glMatrix.vec3.scale(temp, temp, this.delta);
        glMatrix.vec3.subtract(this.positionVector, this.positionVector, temp);   
        this.updateCameraMatrix()
    }

    /** 
     * recaluates the lookAt matrix, call this member function after a move
     */
    updateCameraMatrix()
    {
        let deltaMove = glMatrix.vec3.create()
        glMatrix.vec3.add(deltaMove, this.positionVector, this.viewDirectionVector)
        glMatrix.mat4.lookAt(this.cameraMatrix, this.positionVector, deltaMove, this.upVector)
    }
}



// adds an event listener to window object to 
// process keyboard key presses
//
document.addEventListener("keydown", ProcessKeyPressedEvent, false )

/**
 * Determines which key was pressed and calls the appropriate camera 
 * method
 * 
 * @param{e} event that was fired
 * 
 */
function ProcessKeyPressedEvent(event){
/**
    Process Camera Movement Key   
             w
          A    D
             S
 */
    if(event.key == 'w'){ // dolly forward
    cam.moveForward();       
    } else if (event.key == 's'){ // dolly backward
    cam.moveBackward();  
    } else if (event.key == 'a'){ // strafe left
    cam.strafeLeft(); 
    } else if (event.key == 'd'){ // strafe right
    cam.strafeRight();   
    } else if (event.key == '='){ // pedestal up
    cam.pedestalUp();    
    } else if (event.key == '-'){ // pedestal down
    cam.pedestalDown();      
    } else if (event.key == 'j'){ // pan left
    cam.rotateLeft();
    } else if (event.key == 'l'){ // pan right
    cam.rotateRight();
    } else if (event.key == 'i'){ // pan left
    cam.rotateUp();
    } else if (event.key == 'k'){ // pan right
    cam.rotateDown();
    }
}


