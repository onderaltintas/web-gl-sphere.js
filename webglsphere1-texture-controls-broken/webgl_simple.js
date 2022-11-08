"use strict";


function toRadian(value){
  return value/180*Math.PI
}

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl");

  if (!gl) {
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.textureEnabled = true;
  var tLoaded = false;
  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  // Asynchronously load an image
  var image = new Image();
  image.src = "world.jpg";
  image.addEventListener('load', function() {
    // Now that the image has loaded make copy it to the texture.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    tLoaded = true;
  });

  // setup GLSL program
  var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);
  gl.useProgram(program);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "vertex");
  var normalAttributeLocation = gl.getAttribLocation(program, "normal");
  var texCoordAttributeLocation = gl.getAttribLocation(program, "texCoord");


  // lookup uniforms
  var colorLocation = gl.getUniformLocation(program, "color");
  var projectionMatrixLocation = gl.getUniformLocation(program, "projection");
  var modelviewMatrixLocation = gl.getUniformLocation(program, "modelView");
  var sphere = new Sphere(gl, 1.0, 30, 30, true);

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(now) {
    if(!tLoaded){
      requestAnimationFrame(drawScene);
      return;
    }
    
    now *= 0.001; // convert to seconds
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.textureEnabled = true;
    gl.clearColor(0,0,0,1);
    
    // Clear the canvas.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(normalAttributeLocation);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(texCoordAttributeLocation);


    gl.bindBuffer(gl.ARRAY_BUFFER, sphere.vboVertex);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 32, 24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere.vboIndex);

    // Compute the matrices
    var projectionMatrix = m4.perspective(Math.PI/180*45, gl.canvas.width/gl.canvas.height, 0.1, 1000);


    var modelView = m4.identity();
    //modelView = m4.zRotate(modelView, 20*now/180*Math.PI);


    modelView = m4.multiply(modelView, m4.inverse(m4.lookAt([0,0,5], [0,0,0],[0,1,0])));
    modelView = m4.xRotate(modelView, toRadian(-90));
    modelView = m4.xRotate(modelView, toRadian(yAngle));
    modelView = m4.zRotate(modelView, toRadian(xAngle));

    //modelView = m4.scale( modelView, 5,5,5);
    // Set the matrix.
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(modelviewMatrixLocation, false, modelView);

    // Draw in red
    gl.uniform4fv(colorLocation, [1, 0, 0, 1]);
    gl.drawElements(gl.TRIANGLES, sphere.getIndexCount(), gl.UNSIGNED_SHORT, 0);
    //gl.drawElements(gl.LINE_STRIP, sphere.getIndexCount(), gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(drawScene);
  }

  function resizeCanvasToDisplaySize(canvas) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    // Check if the canvas is not the same size.
    const needResize = canvas.width  !== displayWidth ||
                       canvas.height !== displayHeight;

    if (needResize) {
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }

    return needResize;
  }
}


main();

//mouse!
var mouseDragging = false;
var firstPosX = 0;
var firstPosY = 0;
var xAngle = 0;
var yAngle = 0;
var lastXAngle = 0;
var lastYAngle = 0;

window.addEventListener("mousedown", mouseDown, false);
window.addEventListener("mousemove", mouseMove, false);
window.addEventListener("mouseup", mouseUp, false);

function mouseDown(event){
  firstPosX = event.clientX;
  firstPosY = event.clientY;
  mouseDragging = true;
}

function mouseUp(event){
  lastXAngle = xAngle;
  lastYAngle = yAngle;
  mouseDragging = false;
}

function mouseMove(event) {
  if(mouseDragging){
    xAngle = (event.clientX - firstPosX + lastXAngle)%360;
    yAngle = (event.clientY - firstPosY + lastYAngle)%360;
    console.log(xAngle,yAngle);
  }
}

