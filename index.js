// Game initialization
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreCanvas = document.getElementById('scoreCanvas');
const scoreCtx = scoreCanvas.getContext('2d');
const world = { width: 2000, height: 2000 };
let objects = [];
let score = 0;
let missedTargets = [];
let caughtDistractors = [];
let cursorSize = 40;
let numObjects = 10;
let aiAssistanceOn = false;
let mouseX = 0, mouseY = 0;
let gameInterval, gameStartTime;
const gameTime = 120000; // Two minutes in milliseconds
let isGameRunning = false;
const player = { x: canvas.width / 2, y: canvas.height / 2, speed: 1.5 };
const observableRadius = 400; // Radius for positioning objects
let targetProbability = 0.01;
const camera = {
    x: player.x - canvas.width / 2,
    y: player.y - canvas.height / 2,
    width: canvas.width,
    height: canvas.height
};


// Start Game function
function startGame() {
    // Reset game canvas visibility
    const gameCanvas = document.getElementById('gameCanvas');
    gameCanvas.style.display = 'block';

    // Hide the graph canvas
    const graphCanvas = document.getElementById('missedTargetsGraph');
    graphCanvas.style.display = 'none';

    missedTargets = [];

    console.log('Starting game...');
    if (!isGameRunning) {
        setupCanvas();
        initializeObjects();
        gameStartTime = Date.now();
        gameInterval = setInterval(endGame, gameTime);
        isGameRunning = true;
        gameLoop();
    }
}

// End Game function
function endGame() {
    isGameRunning = false;
    clearInterval(gameInterval);
    console.log("Game Over!");
    // Additional end-game logic here

    // Remove the mousemove event listener
    canvas.removeEventListener('mousemove', handleMouseMove);

    const gameCanvas = document.getElementById('gameCanvas');
    gameCanvas.style.display = 'none';
    // Hide the sliders and robot image
    document.getElementById('sliderContainer').style.display = 'none';
    document.getElementById('robotContainer').style.display = 'none';

    // Show the histogram canvas and center it on the screen
    const missedTargetsGraph = document.getElementById('missedTargetsGraph');
    missedTargetsGraph.style.display = 'block';
    missedTargetsGraph.style.position = 'absolute';
    missedTargetsGraph.style.left = '50%';
    missedTargetsGraph.style.top = '50%';
    missedTargetsGraph.style.transform = 'translate(-50%, -50%)';

    drawMissedTargetsGraph();
}

// // Game loop
// function gameLoop() {
//     if (!isGameRunning) return;

//     if (Date.now() - gameStartTime >= gameTime) {
//         endGame();
//         return;
//     }

//     updateObjects(); // Update positions and states of objects
//     render();        // Draw objects and other elements on canvas
//     requestAnimationFrame(gameLoop); // Continue the loop
// }

const fps = 30; // Desired logic updates per second
const updateInterval = 1000 / fps; // How many milliseconds per logic update

function gameLoop(timestamp) {
    if (!isGameRunning) return;

    if (Date.now() - gameStartTime >= gameTime) {
        endGame();
        return;
    }

    requestAnimationFrame(gameLoop); // Schedule the next frame

    // Calculate time since last update
    var deltaTime = timestamp - lastUpdateTime;
    // Check if it's time for the next update
    if (deltaTime >= updateInterval) {
        lastUpdateTime = timestamp - (deltaTime % updateInterval);
        updateObjects(); // Update game logic
    }

    render(); // Always render as fast as possible (synced to monitor's refresh rate)
}

var lastUpdateTime = 0;
requestAnimationFrame(gameLoop); // Start the loop


// Render function
function render() {
    console.log('Rendering frame');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    drawGrid();                                      // Draw grid
    ctx.save();
    ctx.translate(-canvas.width / 2 + player.x, -canvas.height / 2 + player.y);
    drawWorldBoundary();    // Draw boundaries
    drawObjects();          // Draw objects
    ctx.restore();
    drawMask(ctx, player);
    // drawScore();            // Draw score
    drawCursor(mouseX,mouseY);           // Draw cursor
}

// Initialize game objects
function initializeObjects() {
    objects = [];
    for (let i = 0; i < numObjects; i++) {
        let newObj = createComposite(); // Create a new object with random velocity
        positionObjectsOnRim(newObj);   // Position it on the periphery
        objects.push(newObj);
    }
}

// Update game objects
function updateObjects() {
    console.log('Updating objects');
    objects.forEach((obj, index) => {
        if (obj.active) {
            obj.x += obj.vx; // Update x position
            obj.y += obj.vy; // Update y position
            // Add boundary checks and other logic as needed

            // Check if the object is outside the observable area
            let dx = obj.x - player.x;
            let dy = obj.y - player.y;
            let distanceFromPlayer = Math.sqrt(dx * dx + dy * dy);

            if (distanceFromPlayer > (observableRadius + 10)) {
                obj.active = false; // Set the object to inactive
            }
        }
        // Add to missed array iff : 1) Not Active, 2) Not Tagged, 3) Correct Target Shape.
        if (!obj.active && !obj.clicked && obj.shape === 'triangle') {
            // Log missed triangle
            missedTargets.push({ x: obj.x, y: obj.y, time: new Date()});

            // Calls a function cascade to display a message "Target Missed!"
            targetMissed();
        }

        // If object is inactive, replace it with a new one
        if (!obj.active) {
            objects[index] = createAndPositionNewObject();
        }
        
    });
}

// Function to draw the world boundary
function drawWorldBoundary() {
    ctx.strokeStyle = 'grey';
    ctx.strokeRect(0, 0, world.width, world.height);
}

// Function to draw objects
function drawObjects() {
    objects.forEach(obj => {
        if (obj.active) {
            drawCompositeShape(obj);
        }
    });
}

// Move from start page to game
document.addEventListener('DOMContentLoaded', (event) => {
    // Event listener for cursor size adjustment
    document.getElementById('cursorSize').addEventListener('input', handleCursorSizeChange);
    document.getElementById('targetProbability').addEventListener('input', handleTargetProbChange);
    document.getElementById('numObjects').addEventListener('input', handleNumObjectsChange);
    document.getElementById('toggleAIAssistance').addEventListener('click', toggleAIAssistance);
    document.getElementById('aiAssistRobot').addEventListener('click', toggleAIAssistance);

    // Initialization code for starting page
    initializeStartingPage();

    // Event listener for starting the game by clicking on the canvas
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate the position and size of the "Start Game" text
        const textMetrics = ctx.measureText('Start Game');
        const textWidth = textMetrics.width;
        const textHeight = 30; // Estimate the height or calculate it if needed
        const textX = canvas.width / 2 - textWidth / 2;
        const textY = canvas.height / 2 - textHeight / 2;

        // Check if the click was within the bounds of the "Start Game" text
        if (x > textX && x < textX + textWidth && y > textY && y < textY + textHeight) {
            startGame();
            canvas.removeEventListener('click', startGame); // Remove the event listener after starting the game
        }
    });
});

canvas.addEventListener('mousemove', handleMouseMove);

canvas.addEventListener('click', function(event) {
    // Calculate the click position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;    
    const scaleY = canvas.height / rect.height;
    const canvasX = (event.clientX - rect.left) * scaleX;
    const canvasY = (event.clientY - rect.top) * scaleY;

    // Check each active object to see if it was clicked
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].active && isClickOnObject(objects[i], canvasX, canvasY)) {
            objects[i].active = false;  // Set the object to inactive if it was clicked
            // Additional code for handling clicked object (e.g., increment score)
            objects[i].clicked = true;
        }

        if (objects[i].shape === 'triangle' && objects[i].clicked) {
            targetCaught();
        }
    }
});

// Function to handle cursor size change
function handleCursorSizeChange(event) {
    cursorSize = Number(event.target.value);
}

function handleTargetProbChange(event){
    targetProbability = Number(event.target.value);
}

function handleNumObjectsChange(event){
    const newNumObjects = Number(event.target.value);
    const difference = newNumObjects - objects.length;
    
    if (difference > 0) {
        // Add more objects if the new number is greater
        for (let i = 0; i < difference; i++) {
            let newObj = createComposite();
            positionObjectsOnRim(newObj);
            objects.push(newObj);
        }
    } else {
        // Remove objects if the new number is smaller
        objects.splice(newNumObjects, -difference);
    }
    
    // No need to reinitialize or redraw all objects, just adjust the existing array
}

// Toggle AI assistance function
function toggleAIAssistance() {
    aiAssistanceOn = !aiAssistanceOn; // Toggle the state
    const robotImg = document.getElementById('aiAssistRobot');
    const button = document.getElementById('toggleAIAssistance');

    if (aiAssistanceOn) {
        button.style.backgroundColor = 'green';
        button.textContent = 'AI Assistance: ON';
        robotImg.style.filter = 'drop-shadow(0 0 10px green)'; // Add green glow effect
    } else {
        button.style.backgroundColor = 'red';
        button.textContent = 'AI Assistance: OFF';
        robotImg.style.filter = 'none'; // Remove glow effect
    }
    
    // Redraw the canvas to reflect the change in highlighting
    //render();
}

// Function to initialize the starting page
function initializeStartingPage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Start Game', canvas.width / 2, canvas.height / 2);
}

// Function to handle canvas click
function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    if (isStartGameAreaClicked(canvasX, canvasY)) {
        startGame();
    }
}

// Function to check if the start game area is clicked
function isStartGameAreaClicked(x, y) {
    return x > canvas.width / 2 - 100 && x < canvas.width / 2 + 100 &&
           y > canvas.height / 2 - 20 && y < canvas.height / 2 + 20;
}

// Helper Functions
function setupCanvas() {
    // Fill the background of the entire canvas with grey
    ctx.fillStyle = 'grey';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // Define the game world area with a white rectangle (or any other color your game uses)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, world.width, world.height);
}

function createComposite() {
    let distractorType = Math.random() < 0.5 ? 'circle' : 'square';
    let shapeType = Math.random() < targetProbability ? 'triangle' : distractorType;
    console.log("Shape type assigned:", shapeType); 

    // Define a range for the size
    const minSize = 10; // minimum size
    const maxSize = 30; // maximum size
    const shapeSize = minSize + Math.random() * (maxSize - minSize); // Random size within range

    let newObj = {
        type: 'composite',
        x: 50,
        y: 50,
        vx: 1,
        vy: 1,
        size: shapeSize,
        outerColor: 'blue',
        innerColor: 'orange',
        shape: shapeType, // Add shape type here
        active: true,
        speed: 0.5
    };
    tumble(newObj);
    return newObj;
}

function drawCompositeShape(obj) {
    // Draw the object itself
    ctx.save(); // Save the current state before drawing
    ctx.fillStyle = obj.outerColor;
    ctx.fillRect(obj.x, obj.y, obj.size, obj.size);
    ctx.restore(); // Restore the state after drawing

    // Inner shape
    ctx.save(); // Save again for the inner shape
    ctx.fillStyle = obj.innerColor;
    ctx.beginPath();
    if (obj.shape === 'triangle') {
        getTriangle(obj);
    } else if (obj.shape === 'square') {
        getSquare(obj);
    } else if (obj.shape === 'circle'){
        getCircle(obj);
    }
    ctx.fill();
    ctx.restore(); // Restore after the inner shape

    // Highlighting Target with AI Assistance
    if (aiAssistanceOn && obj.shape === 'triangle') {
        highlightAssist(obj); // Call the highlight function for triangles
    }
}

function positionObjectsOnRim(obj) {
    let angle = Math.random() * 2 * Math.PI; // Random angle
    obj.x = player.x + observableRadius * Math.cos(angle);
    obj.y = player.y + observableRadius * Math.sin(angle);
    setVelocityTowardsObservableArea(obj, angle);
}

function createAndPositionNewObject() {
    let newObj = createComposite(); // Create a new object with random velocity
    positionObjectsOnRim(newObj);   // Position it on the periphery
    newObj.active = true;           // Ensure the new object is active
    newObj.clicked = false;
    return newObj;
}

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

// Helper function to determine if an object is within view ***currently not used***
function isWithinObservableArea(obj) {
    // Calculate the distance from the object to the player
    let dx = obj.x - player.x;
    let dy = obj.y - player.y;
    let distanceSquared = dx * dx + dy * dy;

    // Check if the object is within the observable radius
    return distanceSquared <= observableRadius * observableRadius;
}

function setVelocityTowardsObservableArea(obj, angle) {
    // Angle adjustment to point towards the observable area
    // This can be a fixed value or a small random offset
    const angleAdjustment = (Math.PI/1.1) * (Math.random() - 0.5); // +/- 22.5 degrees

    // Reverse the angle (add PI) and apply the adjustment
    let adjustedAngle = angle + Math.PI + angleAdjustment;

    // Set velocity
    const speed = 1; // Adjust as needed
    obj.vx = Math.cos(adjustedAngle) * speed;
    obj.vy = Math.sin(adjustedAngle) * speed;
}

function drawScore() {
    scoreCtx.clearRect(0, 0, scoreCanvas.width, scoreCanvas.height); // Clear the score canvas
    scoreCtx.font = '16px Roboto';
    scoreCtx.fillStyle = 'black'; // Choose a color that will show on your canvas
    scoreCtx.fillText('Score: ' + score, 10, 20); // Adjust the positioning as needed
}

function drawCursor(x, y) {
    ctx.save(); // Save state
    ctx.fillStyle = 'rgba(100, 100, 100, 0.5)'; // Semi-transparent grey
    ctx.beginPath();
    ctx.arc(x, y, cursorSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore(); // Restore state
}

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Assuming the text is roughly 200px wide and 30px high
    const textWidth = 200;
    const textHeight = 30;
    const textX = canvas.width / 2 - textWidth / 2;
    const textY = canvas.height / 2 - textHeight / 2;

    if (x > textX && x < textX + textWidth && y > textY && y < textY + textHeight) {
        startGame();
    }
}

// Function to handle mouse movement
function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (event.clientX - rect.left);
    mouseY = (event.clientY - rect.top);
}

// Helper function to determine if the click is on the object
function isClickOnObject(obj, x, y) {
    // Calculate the center of the object
    const centerX = obj.x + obj.size / 2;
    const centerY = obj.y + obj.size / 2;

    // Calculate the distance between the click and the object's center
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    // Check if the distance is less than or equal to the cursor size
    return distance <= cursorSize;
}

function drawMask(ctx) {
    if (!ctx) {
      console.error('drawMask: No drawing context provided');
      return;
    }
  
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maskRadius = 400; // Adjust as necessary
  
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(centerX, centerY, maskRadius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
}

// AI Assistance...
function highlightAssist(obj) {
    // Assuming the highlight is a circle around the object
    ctx.save();
    ctx.strokeStyle = 'green'; // Color of highlight
    ctx.lineWidth = 2; // Thickness of highlight line
    ctx.beginPath();

    // Set the radius to be larger than the object's size to surround the object
    // The new radius is the object's size divided by the square root of 2 (approximately 1.414)
    // which is the diagonal of the square, plus some padding
    const radius = (obj.size / Math.sqrt(2)) + 5; // Adding 5 for padding

    // Draw an arc centered on the object
    ctx.arc(obj.x + obj.size / 2, obj.y + obj.size / 2, radius, 0, Math.PI * 2);
    
    ctx.stroke();
    ctx.restore();
}


function getTriangle(obj) {
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

function getCircle(obj) {
    const centerX = obj.x + obj.size / 2;
    const centerY = obj.y + obj.size / 2;
    const radius = obj.size / 3; // Circle's radius is half the size of the square
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
}

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

function drawMissedTargetsGraph(missedTargets, gameTime) {
    const canvas = document.getElementById('missedTargetsGraph');
    const ctx = canvas.getContext('2d');
    canvas.style.display = 'block'; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 40;
    const interval = 10000; // 10-second intervals
    const numIntervals = gameTime / interval;
    let intervalCounts = new Array(numIntervals).fill(0);

    // Count missed targets for each interval
    missedTargets.forEach(target => {
        let intervalIndex = Math.floor((target.time - gameStartTime) / interval);
        if (intervalIndex < numIntervals) {
            intervalCounts[intervalIndex]++;
        }
    });

    // Find max count for scaling
    let maxCount = Math.max(...intervalCounts);

    // Draw bars for each interval
    for (let i = 0; i < numIntervals; i++) {
        let barHeight = (intervalCounts[i] / maxCount) * (canvas.height - 2 * padding);
        let barWidth = (canvas.width - 2 * padding) / numIntervals;
        let x = padding + i * barWidth;
        let y = canvas.height - padding - barHeight;

        ctx.fillStyle = '#007bff';
        ctx.fillRect(x, y, barWidth - 5, barHeight); // -5 for spacing between bars

        ctx.fillText(`${i * 10}s`, x, canvas.height - padding + 20);
    }

    // Additional styling like axes, labels, etc.

    // Draw y-axis labels (number of targets)
    const yAxisLabelCount = 5; // For example, 5 labels on the y-axis
    for (let i = 0; i <= yAxisLabelCount; i++) {
        let label = Math.round(maxCount * (i / yAxisLabelCount));
        let y = canvas.height - padding - (i * (canvas.height - 2 * padding) / yAxisLabelCount);

        ctx.fillText(label, padding - 10, y);
    }

    ctx.save();
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Missed Targets", -canvas.height / 2, padding - 10);
    ctx.restore();
}

function showTargetMessage(isCaught) {
    var messageBox = document.getElementById('messageBox');
    var gameMessage = document.getElementById('gameMessage');
  
    messageBox.style.display = 'block'; // Show the message box
    gameMessage.textContent = isCaught ? 'Target Caught!' : 'Target Missed!'; // Set the message
  
    // Optionally, hide the message after a delay
    setTimeout(function() {
      messageBox.style.display = 'none';
    }, 2000); // Hide the message after 2 seconds
}
  
function targetMissed() {
    showTargetMessage(false);
}

function targetCaught() {
    showTargetMessage(true);
}
  
