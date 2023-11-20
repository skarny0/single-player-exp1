// ------------------------------------------------------------------------------------------------------------------------//
// Initialitize Game Environments

// Get the main game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Get the mini-map canvas and context
// const miniMapCanvas = document.getElementById('miniMapCanvas');
// const miniMapCtx = miniMapCanvas.getContext('2d');

// Get the score canvas and context
const scoreCanvas = document.getElementById('scoreCanvas');
const scoreCtx = scoreCanvas.getContext('2d'); // This should be 'scoreCtx', not 'scoreCanvas'


// Define the game world boundaries
const world = {
  width: 2000, // Example width, you can set it as needed
  height: 2000 // Example height, you can set it as needed
};

// Mini-map configuration
const miniMap = {
  width: 150,
  height: 100,
  scale: 0.1, // Scale of the mini-map compared to the main canvas
  x: canvas.width - 150,
  y: canvas.height - 100
};

// ------------------------------------------------------------------------------------------------------------------------//

function setupCanvas() {
  // Fill the background of the entire canvas with grey
  ctx.fillStyle = 'grey';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Define the game world area with a white rectangle (or any other color your game uses)
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, world.width, world.height);
}

// Call this function once during your game's initialization process
setupCanvas();

// ------------------------------------------------------------------------------------------------------------------------//

function getTriangle(obj){
    // Define the points of the triangle
    // Assuming obj.size is the length of the side of the square
    const halfSize = obj.size / 2;
    const quarterSize = obj.size / 4;
    const threeQuarterSize = 3 * obj.size / 4;

    // Adjusted points for the triangle to be centered inside the square
    // Top point of the triangle (center of the top edge of the square)
    ctx.moveTo(obj.x + halfSize, obj.y + quarterSize);

    // Bottom right of the triangle (halfway down the right edge of the square)
    ctx.lineTo(obj.x + threeQuarterSize, obj.y + threeQuarterSize);

    // Bottom left of the triangle (halfway down the left edge of the square)
    ctx.lineTo(obj.x + quarterSize, obj.y + threeQuarterSize);
}

function getSquare(obj) {
    // Define the points of the rectangle
    // Assuming obj.size is the length of the side of the square
    const halfSize = obj.size / 2;
    const quarterSize = obj.size / 4;
    const threeQuarterSize = 3 * obj.size / 4;

    // Adjusted points for the rectangle to be centered inside the square
    // Top left point of the rectangle (one quarter down from the top edge of the square)
    ctx.moveTo(obj.x + quarterSize, obj.y + quarterSize);

    // Top right point of the rectangle (one quarter down from the top edge of the square)
    ctx.lineTo(obj.x + threeQuarterSize, obj.y + quarterSize);

    // Bottom right point of the rectangle (three quarters down from the top edge of the square)
    ctx.lineTo(obj.x + threeQuarterSize, obj.y + threeQuarterSize);

    // Bottom left point of the rectangle (three quarters down from the top edge of the square)
    ctx.lineTo(obj.x + quarterSize, obj.y + threeQuarterSize);

    // Close the path back to the top left point
    ctx.lineTo(obj.x + quarterSize, obj.y + quarterSize);
}

function createComposite() {
    let shapeType = Math.random() < 0.1 ? 'triangle' : 'square';
    console.log("Shape type assigned:", shapeType); 

    return {
        type: 'composite',
        x: 50,
        y: 50,
        vx: 1,
        vy: 1,
        size: 20,
        outerColor: 'blue',
        innerColor: 'orange',
        shape: shapeType, // Add shape type here
        active: true,
        speed: 2
    };
}

function drawCompositeShape(obj) {
    // Outer shape (square)
    ctx.fillStyle = obj.outerColor;
    ctx.fillRect(obj.x, obj.y, obj.size, obj.size);

    // Inner shape
    ctx.fillStyle = obj.innerColor;
    ctx.beginPath();

    // Draw the specified shape
    if (obj.shape === 'triangle') {
        getTriangle(obj);
    } else {
        getSquare(obj);
    }

    ctx.closePath();
    ctx.fill();
}

// ------------------------------------------------------------------------------------------------------------------------//

// Player object
const player = { x: canvas.width / 2, y: canvas.height / 2, speed: 1.5 };

// Assuming you have a variable for observable radius
const observableRadius = 400; // Adjust as needed

function positionObjectsOnRim() {
    objects.forEach((obj, index) => {
        // Calculate the angle for each object based on its index or other criteria
        let angle = 2 * Math.PI / objects.length * index;

        // Calculate x and y positions on the rim of the observable view
        obj.x = player.x + observableRadius * Math.cos(angle);
        obj.y = player.y + observableRadius * Math.sin(angle);
    });
}

let objects = [];

// Define the number of dummy objects you want
const numComp = 40; // Example number

// Create dummy objects and add them to the objects array
for (let i = 0; i < numComp; i++) {
  // objects.push(createDummy());
  objects.push(createComposite());
}

// Position objects on the rim of the observable area
positionObjectsOnRim();

// ------------------------------------------------------------------------------------------------------------------------//
// Function to draw the player
function drawPlayer() {
  ctx.fillStyle = 'green';
  // Draw the player in the center of the canvas
  ctx.fillRect(canvas.width / 2 - 10, canvas.height / 2 - 10, 20, 20);
}

// Camera configuration
const camera = {
  x: player.x - canvas.width / 2,
  y: player.y - canvas.height / 2,
  width: canvas.width,
  height: canvas.height
};

// Update the camera position to follow the player
function updateCamera() {
  camera.x = player.x - canvas.width / 2;
  camera.y = player.y - canvas.height / 2;
}
// ------------------------------------------------------------------------------------------------------------------------//

// Draw Grid function
function drawGrid() {
  // Begin path for grid lines
  ctx.beginPath();
  ctx.strokeStyle = '#CCCCCC';

  // Calculate the start and end points for the grid lines
  const leftmostLine = camera.x - (camera.x % 100);
  const topmostLine = camera.y - (camera.y % 100);

  // Vertical lines
  for (let x = leftmostLine; x < camera.x + canvas.width; x += 100) {
    ctx.moveTo(x - camera.x, 0);
    ctx.lineTo(x - camera.x, canvas.height);
  }

  // Horizontal lines
  for (let y = topmostLine; y < camera.y + canvas.height; y += 100) {
    ctx.moveTo(0, y - camera.y);
    ctx.lineTo(canvas.width, y - camera.y);
  }

  // Stroke the grid lines
  ctx.stroke();
}

// Global variables to hold mini-map viewport details
let miniMapViewport = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

// Draw the mini-map
function drawMiniMap() {
  // These variables must be defined in this scope as well
  const scaleX = miniMapCanvas.width / world.width;
  const scaleY = miniMapCanvas.height / world.height;

  // Clear the mini-map
  miniMapCtx.clearRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);

  // Draw the mini-map background
  miniMapCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  miniMapCtx.fillRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);

  // Draw the player's location on the mini-map as a yellow dot
  const playerX = player.x * scaleX;
  const playerY = player.y * scaleY;
  miniMapCtx.fillStyle = 'yellow';
  miniMapCtx.beginPath();
  miniMapCtx.arc(playerX, playerY, 2, 0, Math.PI * 2);
  miniMapCtx.fill();

  // Draw the circular viewport on the mini-map
  const observableRadiusOnMiniMap = 400 * scaleX; // Assuming scaleX and scaleY are about the same
  miniMapCtx.strokeStyle = 'white';
  miniMapCtx.beginPath();
  miniMapCtx.arc(playerX, playerY, observableRadiusOnMiniMap, 0, Math.PI * 2);
  miniMapCtx.stroke();
}

// Update MiniMap function
function updateMiniMap() {
  // Calculate scale factors for the mini-map
  const scaleX = miniMapCanvas.width / world.width;
  const scaleY = miniMapCanvas.height / world.height;
}

// ------------------------------------------------------------------------------------------------------------------------//
// Handling object movement & motion

// Key press state
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};
 
// Helper function to generate a random angle in radians
function getRandomAngle() {
  return Math.random() * 2 * Math.PI; // Random angle between 0 and 2π
}

// Helper function to update an object's velocity based on a random angle
function tumble(obj) {
  let angle = getRandomAngle();
  obj.vx = Math.cos(angle) * obj.speed;
  obj.vy = Math.sin(angle) * obj.speed;

  console.log(`Initial velocity for object: vx = ${obj.vx}, vy = ${obj.vy}`);
}

// Define the size of the cubes (assuming they are square)
const cubeSize = 20;

// Update the objects' positions to make them move with run-and-tumble behavior
function updateObjects() {
    objects.forEach(obj => {
      // Check if the object is active before updating
      if (obj.active) {
        // Apply tumble if velocities are not valid
        if (isNaN(obj.vx) || isNaN(obj.vy) || obj.vx === 0 || obj.vy === 0) {
          tumble(obj);
        }
  
        // Update the position
        obj.x += obj.vx;
        obj.y += obj.vy;
        // console.log(`Object position: (${obj.x}, ${obj.y}) Velocity: (${obj.vx}, ${obj.vy})`);
  
        // Check if the object has exited the game view and mark as inactive
        if (obj.x < 0 || obj.x > canvas.width || obj.y < 0 || obj.y > canvas.height) {
          obj.active = false; 
          console.log("object exited game view");
        }
      }
    });
  
    // Optionally, you can filter out inactive objects here
    objects = objects.filter(obj => obj.active);
}
  

// Initialize objects with a speed and a random direction
objects.forEach(obj => {
    obj.speed = 1; // Adjust speed as needed
    tumble(obj); // Give it an initial random direction
});      

function areAllObjectsInactive() {
    return objects.every(obj => !obj.active);
}

function regenerateObjects() {
    objects = []; // Clear the current objects
    for (let i = 0; i < numComp; i++) {
        let newObj = createComposite();
        newObj.active = true; // Reset active status
        tumble(newObj); // Apply tumble to set random direction
        objects.push(newObj);
    }
    positionObjectsOnRim(); // Reposition objects if necessary
}

// ------------------------------------------------------------------------------------------------------------------------//
// Handle Collisions

let score = 0;  // Initialize the player's score

window.addEventListener('click', function(event) {
    // Calculate click position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;    // relationship bitmap vs. element for X
    const scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y
  
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;
  
    // Check if we have clicked on any object
    objects.forEach(obj => {
      if (isClickOnObject(obj, canvasX, canvasY)) {
        obj.active = false; // Disable the object if it was clicked
        // Handle score or any other object specific logic here
        if (obj.shape === 'triangle') {
          console.log("Target!");
          score += 10;
          obj.active = false;
        } else if (obj.shape === 'square') {
          console.log("Distractor!");
          score -= 10;
          obj.active = false;
        }
      }
    });
});

function isClickOnObject(obj, x, y) {
    const halfSize = 20; // Half the size of your object, assuming 20x20 as in your draw function
    // Check if the click x, y coordinates are within the object's boundaries
    return x > obj.x - halfSize &&
           x < obj.x + halfSize &&
           y > obj.y - halfSize &&
           y < obj.y + halfSize;
}  

function drawScore() {
  scoreCtx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height); // Clear the score canvas
  scoreCtx.font = '16px Roboto';
  scoreCtx.fillStyle = 'black'; // Choose a color that will show on your canvas
  scoreCtx.fillText('Score: ' + score, 10, 20); // Adjust the positioning as needed
}

// ------------------------------------------------------------------------------------------------------------------------//

function drawMask(ctx, player) {
  // The mask is centered on the canvas, which is the player's constant position on the screen
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maskRadius = 400; // This is the radius of the mask's visible area

  // Save the current context state
  ctx.save();

  // Clear any previous mask
  ctx.globalCompositeOperation = 'destination-in';

  // Begin path for a circular mask
  ctx.beginPath();
  ctx.arc(centerX, centerY, maskRadius, 0, Math.PI * 2, false);
  ctx.fill();

  // Reset the composite operation to default
  ctx.globalCompositeOperation = 'source-over';

  // Restore the context to its previous state
  ctx.restore();
}

// ------------------------------------------------------------------------------------------------------------------------//

// Game loop
function gameLoop() {
  const start = performance.now();
  updateObjects(); // Update object positions
  
  objects.forEach(obj => {
    if (obj.active) {
      drawCompositeShape(obj); // Draw each object
    }
  });

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the fixed grid based on the camera's position
  drawGrid();

  // Translate the canvas context to keep the player in the center
  ctx.save();

  ctx.translate(-player.x + canvas.width / 2, -player.y + canvas.height / 2);

  // Draw the game world boundary
  ctx.strokeStyle = 'grey';
  ctx.strokeRect(0, 0, world.width, world.height);

  // Draw objects relative to player's position
  // Draw objects relative to player's position
    objects.forEach(obj => {
        if (obj.active !== false) {
            if (obj.type === 'composite') {
            drawCompositeShape(obj); // Call this for composite objects
            } else {
            // For non-composite objects
            ctx.fillStyle = obj.color;
            ctx.fillRect(obj.x, obj.y, 20, 20);

            // Draw label only if it exists
            if (obj.label) {
                ctx.font = '16px Roboto';
                ctx.fillStyle = 'white';
                ctx.fillText(obj.label, obj.x + 5, obj.y + 16);
            }
            }
        }
    });

  // // Filter out inactive objects so they are no longer rendered or updated
  objects = objects.filter(obj => obj.active !== false);

  // Draw Score
  drawScore();
  // Reset transformation before drawing player
  ctx.restore();
  drawPlayer(ctx, player, camera);
  drawMask(ctx, player);

  if (areAllObjectsInactive()){
    regenerateObjects();
  } 
  const end = performance.now();
  console.log(`Frame Time: ${end - start} ms`);

  // Loop the game
  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();