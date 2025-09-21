//#region Constants
//CONFIG: Constants
const MAZE_CONTAINER = document.getElementById("maze-container");
const MAX_CONTAINER_SIZE = 500;
const DEFAULT_CONFIG = {
    rows: 30,
    cols: 30,
    delay: 5,
    isPathHighlighted: false,
};
const DIRECTIONS = {
    TOP: "top",
    BOTTOM: "bottom",
    LEFT: "left",
    RIGHT: "right",
};
const MAX_ITERATIONS = 5000;
//#endregion
var cells = [];
var interval = null;

// Load Grid and generate maze after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    initializeGrid();
    setTimeout(() => {
        generateMaze();
    }, 1000);
});

//#region Maze Generation
/**
 * Generates a maze by using recursive backtracking algorithm,
 * [Reference](https://aryanab.medium.com/maze-generation-recursive-backtracking-5981bc5cc766).
 * The maze is rendered after the grid is initialized.
 * The function pulls the grid dimensions and delay from local storage.
 * The function uses a stack to keep track of the cell indexes that it has visited.
 * The function marks a cell as visited and then recursively calls itself until it has visited all the cells in the grid.
 * The function then returns the solution to the maze in the form of a stack of cell indexes.
 * @returns {boolean} true if the maze is generated successfully, false otherwise.
 */
function generateMaze() {
    initializeGrid();
    const rows = Number(localStorage.getItem("rows"));
    const cols = Number(localStorage.getItem("cols"));
    const delay = Number(localStorage.getItem("delay"));

    stopInterval();

    let stack = [];
    let largestStack = [];
    let currentIndex = selectRandomStartCell(rows, cols);
    markCellAsVisited(cells[currentIndex]);
    let iteration = 0;

    // If delay is greater than 4, use interval else while loop to instantly generate maze
    if (delay >= 4) {
        interval = setInterval(() => {
            const result = processMazeGenerationStep(currentIndex, stack, largestStack, rows, cols);
            currentIndex = result.currentIndex;
            stack = result.stack;
            largestStack = result.lgstStk;
            this.solution = largestStack;
            iteration++;
            if (result.isFinished) {
                stopInterval();
            }
            if (iteration > MAX_ITERATIONS) {
                stopInterval();
                console.warn("Timeout");
            }
        }, delay);
    } else if (delay < 4) {
        while (true) {
            const result = processMazeGenerationStep(currentIndex, stack, largestStack, rows, cols);
            currentIndex = result.currentIndex;
            stack = result.stack;
            largestStack = result.lgstStk;
            this.solution = largestStack;
            iteration++;
            if (result.isFinished) {
                break;
            }
            if (iteration > MAX_ITERATIONS) {
                console.warn("Timeout");
                break;
            }
        }
    }

    attachCellListeners(); // For interactivity
    MAZE_CONTAINER.classList.remove("finish");

    console.log("Finished generating maze");
    return true;
}

/**
 * Process a single step in the maze generation algorithm.
 * The function processes one cell and either visits a non-visited adjacent cell or backtracks
 * to a previously visited cell.
 * The function returns an object containing the current index, the stack, the largest stack found so far,
 * and a boolean indicating whether the maze generation is finished (all cells have been visited).
 * @param {number} currentIdx - The index of the current cell in the grid.
 * @param {number[]} stk - The stack of cell indexes that have been visited.
 * @param {number[]} lgstStk - The largest stack of cell indexes found so far.
 * @param {number} rows - The number of rows in the grid.
 * @param {number} cols - The number of columns in the grid.
 * @returns {Object} - An object containing the current index, the stack, the largest stack found so far, and a boolean indicating whether the maze generation is finished.
 */
function processMazeGenerationStep(currentIdx, stk, lgstStk, rows, cols) {
    const adjacentCellInfo = getRandomAdjacentCell(currentIdx, rows, cols);
    const adjacentCellIndex = adjacentCellInfo[0];
    const direction = adjacentCellInfo[1];

    let isFinished = false;

    // If adjacent cell is found push it to the stack and mark it as visited
    // else if stack is not empty, pop a cell from the stack i.e algorithm has reached a dead end
    // else maze is finished as no non visited adjacent cell is found
    if (adjacentCellIndex != undefined) {
        stk.push(currentIdx);
        createPath(currentIdx, adjacentCellIndex, direction);
        currentIdx = adjacentCellIndex;
        markCellAsVisited(cells[currentIdx]);
    } else if (stk.length > 0) {
        const cell = getCell(stk[stk.length - 1]);
        cell.classList.add("backtrack");
        if (stk.length > lgstStk.length - 1) {
            lgstStk = stk.slice();
            lgstStk.push(currentIdx);
        }
        currentIdx = stk.pop();
    } else {
        // Stack becomes empty here as no non visited adjacent cell is found in the entire maze
        const cell = getCell(lgstStk.pop());
        cell.classList.add("end");
        MAZE_CONTAINER.classList.add("finish");
        isFinished = true;
    }

    return {
        currentIndex: currentIdx,
        stack: stk,
        lgstStk: lgstStk,
        isFinished: isFinished,
    };
}

/**
 * Returns a random adjacent cell index from the given cell index.
 * The function checks all four directions (top, bottom, left, right) and
 * returns a random adjacent cell index that has not been visited.
 * It also returns the direction of the chosen adjacent cell.
 * @param {number} cellIndex - The index of the current cell in the grid.
 * @param {number} rows - The number of rows in the grid.
 * @param {number} cols - The number of columns in the grid.
 * @returns {Array<number, number>} An array containing the chosen adjacent cell
 * index and the direction of the chosen adjacent cell relative to the current cell.
 */
function getRandomAdjacentCell(cellIndex, rows, cols) {
    let adjacentCellIndexes = [];

    const topIndex = cellIndex - cols;
    const bottomIndex = cellIndex + cols;
    const leftIndex = cellIndex - 1;
    const rightIndex = cellIndex + 1;
    let direction;

    // Top
    if (cellIndex >= cols && !hasCellBeenVisited(cells[topIndex])) {
        adjacentCellIndexes.push(topIndex);
    }
    // Bottom
    if (cellIndex < (rows - 1) * cols && !hasCellBeenVisited(cells[bottomIndex])) {
        adjacentCellIndexes.push(bottomIndex);
    }
    // Left
    if (cellIndex % cols != 0 && !hasCellBeenVisited(cells[leftIndex])) {
        adjacentCellIndexes.push(leftIndex);
    }
    // Right
    if (cellIndex % cols != cols - 1 && !hasCellBeenVisited(cells[rightIndex])) {
        adjacentCellIndexes.push(rightIndex);
    }

    const randomIndex = Math.floor(Math.random() * adjacentCellIndexes.length);
    const chosenAdjacentCellIndex = adjacentCellIndexes[randomIndex];

    // Set Direction
    if (chosenAdjacentCellIndex == topIndex) {
        direction = DIRECTIONS.TOP;
    } else if (chosenAdjacentCellIndex == bottomIndex) {
        direction = DIRECTIONS.BOTTOM;
    } else if (chosenAdjacentCellIndex == leftIndex) {
        direction = DIRECTIONS.LEFT;
    } else if (chosenAdjacentCellIndex == rightIndex) {
        direction = DIRECTIONS.RIGHT;
    }
    return [chosenAdjacentCellIndex, direction];
}

/**
 * Creates a path between two cells in the maze by removing the corresponding border (CSS Property)
 * between them.
 * @param {number} currentIdx - The index of the current cell in the grid.
 * @param {number} adjIndex - The index of the adjacent cell in the grid.
 * @param {string} direction - The direction of the adjacent cell relative to the current cell.
 */
function createPath(currentIndex, adjIndex, direction) {
    if (direction == DIRECTIONS.TOP) {
        cells[currentIndex].style.setProperty("border-top", "none");
        cells[adjIndex].style.setProperty("border-bottom", "none");
    } else if (direction == DIRECTIONS.BOTTOM) {
        cells[currentIndex].style.setProperty("border-bottom", "none");
        cells[adjIndex].style.setProperty("border-top", "none");
    } else if (direction == DIRECTIONS.LEFT) {
        cells[currentIndex].style.setProperty("border-left", "none");
        cells[adjIndex].style.setProperty("border-right", "none");
    } else if (direction == DIRECTIONS.RIGHT) {
        cells[currentIndex].style.setProperty("border-right", "none");
        cells[adjIndex].style.setProperty("border-left", "none");
    }
}

/**
 * Toggles highlighting of the path in the maze.
 * The function takes a stack of cell indexes as an argument and toggles the highlighting of the path (for solution).
 * The function stores the state of the highlighting in local storage and updates the CSS properties of the cells.
 * @param {number[]} stack - The stack of cell indexes representing the path in the maze.
 */

function toggleHighlightPath(stack) {
    let isPathHighlighted = localStorage.getItem("isPathHighlighted") == "true" ? true : false;
    let path = stack.slice(); // Convert stack to array so a perfect copy is created instead of reference

    //Note: Starting cell is not part of the path (solution)
    path.shift(); // Remove the starting cell from the path

    isPathHighlighted = !isPathHighlighted;
    localStorage.setItem("isPathHighlighted", isPathHighlighted);

    let i = 0;
    path.forEach((cellIdx) => {
        cell = cells[cellIdx];
        if (isPathHighlighted) {
            cell.classList.add("solution");
            cell.style.setProperty("--anim-delay", i); // Variable delay for animation
        } else {
            cell.classList.remove("solution");
        }
        i++;
    });
}

/**
 * Function checks if the maze has been solved by the user.
 * It takes a stack of cell indexes representing the solution path in the maze
 * and checks if the user has clicked all the cells in the path and not any extra cells.
 * @param {number[]} stack - The stack of cell indexes representing the solution path in the maze.
 * @returns {boolean} - true if the maze has been solved, false otherwise.
 */
function checkIfSolved(stack) {
    cells = MAZE_CONTAINER.querySelectorAll(".cell");
    const solutionPath = stack.slice();
    solutionPath.shift(); // Remove starting cell

    //? For every cell in the solution path, check if it has been clicked
    //? Here, pathIdx is the cell index in solutionPath
    const solutionPathClicked = solutionPath.every((pathIdx) => cells[pathIdx].classList.contains("clicked"));
    //Note: Instead of using array.forEach and check condition for one cell at a time
    //&     we can use array.every to check all cells at once

    //? Check if any extra cells have been clicked
    //? First convert cells to array then use array.every to check
    //? if any extra cells have been clicked
    const noExtraClicks = Array.from(cells).every((cell, idk) => {
        if (cell.classList.contains("clicked")) {
            return solutionPath.includes(idk);
        }
        return true;
    });

    return solutionPathClicked && noExtraClicks;
}
//#endregion

//#region Grid Management
/**
 * Initializes the grid with the stored dimensions and clears any previous intervals, if any.
 */
function initializeGrid() {
    const rows = Number(localStorage.getItem("rows"));
    const cols = Number(localStorage.getItem("cols"));
    localStorage.setItem("isPathHighlighted", false);
    MAZE_CONTAINER.classList.remove("solved");

    setGridDimensions(rows, cols);
    stopInterval();
    renderGrid(rows, cols);
    adjustGridSize(rows, cols);
}

/**
 * Renders the grid based on the given row and column counts
 * by inserting HTML elements into the maze container.
 * @param {number} rowCount - The number of rows in the grid.
 * @param {number} columnCount - The number of columns in the grid.
 */
function renderGrid(rowCount, columnCount) {
    let html = "";

    for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
        for (let columnIndex = 0; columnIndex < columnCount; ++columnIndex) {
            html += `<div class="cell" data-isVisited="false"></div>`;
        }
    }

    MAZE_CONTAINER.innerHTML = html;
    cells = MAZE_CONTAINER.querySelectorAll(".cell");
}

/**
 * Adjusts the grid size based on the given row and column counts.
 * The function calculates the size of each cell in the grid by dividing the
 * container size (Global Constant) by the row or column whichever is larger.
 * It then sets the width and height of the maze container in CSS based on the
 * calculated cell size and the given row and column counts.
 * @param {number} rows - The number of rows in the grid.
 * @param {number} cols - The number of columns in the grid.
 */
function adjustGridSize(rows, cols) {
    const cellSize = Math.floor(MAX_CONTAINER_SIZE / Math.max(rows, cols));

    const width = cellSize * cols;
    const height = cellSize * rows;

    MAZE_CONTAINER.style.setProperty("--maze-width", width + "px");
    MAZE_CONTAINER.style.setProperty("--maze-height", height + "px");

    MAZE_CONTAINER.style.aspectRatio = "";
}

/**
 * The function sets the --rows and --cols CSS properties to the given values.
 * These properties are used to set the grid-template-rows and grid-template-columns
 * CSS properties of the maze container.
 * @param {number} rows - The number of rows in the grid.
 * @param {number} cols - The number of columns in the grid.
 */
function setGridDimensions(rows, cols) {
    document.documentElement.style.setProperty("--rows", rows);
    document.documentElement.style.setProperty("--cols", cols);
}

//#region Cell Management

/**
 * Selects a random cell from the grid and marks it as the start cell.
 * The function returns the index of the selected cell (start cell).
 * @param {number} rows - The number of rows in the grid.
 * @param {number} cols - The number of columns in the grid.
 * @returns {number} The index of the selected start cell.
 */
function selectRandomStartCell(rows, cols) {
    const randomIndex = Math.floor(Math.random() * rows * cols);
    const cell = cells[randomIndex];
    cell.classList.add("start");
    return randomIndex;
}

/**
 * The function Checks if a cell has been visited by checking the "data-isVisited" property of the cell.
 * @param {HTMLElement} cell - The cell to check.
 * @returns {boolean} true if the cell has been visited, false otherwise.
 */
function hasCellBeenVisited(cell) {
    return cell.dataset.isVisited == "true";
}

/**
 * Marks a cell as visited by setting the "data-isVisited" property to "true" and
 * adding the "visited" class to the cell for sick animations.
 * @param {HTMLElement} cell - The cell to mark as visited.
 */
function markCellAsVisited(cell) {
    cell.dataset.isVisited = "true";
    cell.classList.add("visited");
}

/**
 * Returns the cell at the given index from the grid.
 * @param {number} cellIndex - The index of the cell to return.
 * @returns {HTMLElement} The cell at the given index.
 */
function getCell(cellIndex) {
    return cells[cellIndex];
}

//#region Control
/**
 * Stops any currently running interval for the maze generation algorithm.
 * It is used to interrupt the algorithm when the "Stop" button is clicked,
 * user wants to generate a new maze or when the maze is finished generating (all cells have been visited).
 */
function stopInterval() {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
}

/**
 * Resets all stored variables to default state.
 * Clears local storage, resets the grid dimensions to their default values, and
 * removes the "solved" class from the maze container.
 * Also stops any currently running interval and initializes the grid.
 */

function reset() {
    localStorage.clear();

    localStorage.setItem("rows", DEFAULT_CONFIG.rows);
    localStorage.setItem("cols", DEFAULT_CONFIG.cols);
    localStorage.setItem("delay", DEFAULT_CONFIG.delay);
    localStorage.setItem("isPathHighlighted", DEFAULT_CONFIG.isPathHighlighted);

    document.documentElement.style.setProperty("--rows", DEFAULT_CONFIG.rows);
    document.documentElement.style.setProperty("--cols", DEFAULT_CONFIG.cols);

    MAZE_CONTAINER.classList.remove("solved");

    stopInterval();
    initializeGrid();
}

//#region UI Event Handlers
{
    // Sliders and Input Fields
    const rowSlider = document.getElementById("slider-rows");
    const columnSlider = document.getElementById("slider-cols");
    const delaySlider = document.getElementById("slider-delay");
    const rowsInputField = document.getElementById("rows-value");
    const columnInputField = document.getElementById("cols-value");
    const delayInputField = document.getElementById("delay-value");

    // Buttons
    const generateMazeButton = document.getElementById("generate-maze-button");
    const checkMazeButton = document.getElementById("check-maze-button");
    const solutionButton = document.getElementById("solution-button");
    const resetButton = document.getElementById("reset-button");
    const stopMazeButton = document.getElementById("stop-maze-button");

    // Getting max and min values
    const rowsSliderMax = Number(rowSlider.max);
    const colsSliderMax = Number(columnSlider.max);
    const delaySliderMax = Number(delaySlider.max);
    const rowsSliderMin = Number(rowSlider.min);
    const colsSliderMin = Number(columnSlider.min);
    const delaySliderMin = Number(delaySlider.min);

    // Stored Variables
    const rows = Number(localStorage.getItem("rows") == null ? DEFAULT_CONFIG.rows : localStorage.getItem("rows"));
    const cols = Number(localStorage.getItem("cols") == null ? DEFAULT_CONFIG.cols : localStorage.getItem("cols"));
    const delay = Number(localStorage.getItem("delay") == null ? DEFAULT_CONFIG.delay : localStorage.getItem("delay"));

    // Set slider and input field values to current stored values
    rowsInputField.value = rows;
    columnInputField.value = cols;
    delayInputField.value = delay;
    rowSlider.value = rows;
    columnSlider.value = cols;
    delaySlider.value = delay;

    // Whatever the current value of the slider is will be stored in this variable
    let inputValue = 0;
    // To check if the user is swiping
    let isSwiping = false;

    //Note: element.addEventListener("event", function);
    //&     element.addEventListener("event", (event) => {function});
    //& Here, (event) => {function} is an arrow function
    //& It allows you to define a function that will be executed
    //& when a particular event occurs on that element
    // Update the elements related to rows
    rowSlider.addEventListener("input", (event) => {
        inputValue = event.target.value;
        rowsInputField.value = inputValue;
        localStorage.setItem("rows", inputValue);
    });
    rowsInputField.addEventListener("input", (event) => {
        inputValue = Number(event.target.value);
        if (inputValue > rowsSliderMax) {
            rowsInputField.value = rowsSliderMax;
            rowSlider.value = rowsSliderMax;
            localStorage.setItem("rows", rowsSliderMax);
        } else if (inputValue < rowsSliderMin) {
            rowsInputField.value = rowsSliderMin;
            rowSlider.value = rowsSliderMin;
            localStorage.setItem("rows", rowSliderMin);
        } else {
            rowSlider.value = inputValue;
            localStorage.setItem("rows", inputValue);
        }
    });

    // Update the elements related to columns
    columnSlider.addEventListener("input", (event) => {
        inputValue = event.target.value;
        columnInputField.value = inputValue;
        localStorage.setItem("cols", inputValue);
    });
    columnInputField.addEventListener("input", (event) => {
        inputValue = Number(event.target.value);
        if (inputValue > colsSliderMax) {
            columnInputField.value = colsSliderMax;
            columnSlider.value = colsSliderMax;
            localStorage.setItem("cols", colsSliderMax);
        } else if (inputValue < colsSliderMin) {
            columnInputField.value = colsSliderMin;
            columnSlider.value = colsSliderMin;
            localStorage.setItem("cols", colsSliderMin);
        } else {
            columnSlider.value = inputValue;
            localStorage.setItem("cols", inputValue);
        }
    });

    // Update the elements related to delay
    delaySlider.addEventListener("input", (event) => {
        inputValue = event.target.value;
        if (inputValue <= 3 && inputValue >= 0) {
            delayInputField.value = 0;
            delaySlider.value = 0;
            localStorage.setItem("delay", 0);
        } else {
            delayInputField.value = inputValue;
            localStorage.setItem("delay", inputValue);
        }
    });
    delayInputField.addEventListener("input", (event) => {
        inputValue = Number(event.target.value);
        if (inputValue > delaySliderMax) {
            delayInputField.value = delaySliderMax;
            delaySlider.value = delaySliderMax;
            localStorage.setItem("delay", delaySliderMax);
        } else if (inputValue <= 3 && inputValue >= 0) {
            delayInputField.value = 0;
            delaySlider.value = 0;
            localStorage.setItem("delay", 0);
        } else if (inputValue < delaySliderMin) {
            delayInputField.value = delaySliderMin;
            delaySlider.value = delaySliderMin;
            localStorage.setItem("delay", delaySliderMin);
        } else {
            delaySlider.value = inputValue;
            localStorage.setItem("delay", inputValue);
        }
    });

    // Generate Maze
    generateMazeButton.addEventListener("click", () => {
        generateMaze();
    });

    // Check if Maze is solved by the user
    checkMazeButton.addEventListener("click", () => {
        if (checkIfSolved(this.solution)) {
            MAZE_CONTAINER.classList.add("solved");
        } else {
            MAZE_CONTAINER.classList.remove("solved");
            MAZE_CONTAINER.classList.remove("unsolved");
            setTimeout(() => {
                MAZE_CONTAINER.classList.add("unsolved");
            }, 20);
        }
    });

    // Show Solution
    solutionButton.addEventListener("click", () => {
        toggleHighlightPath(this.solution);
    });

    // Reset Maze
    resetButton.addEventListener("click", () => {
        rowSlider.value = DEFAULT_CONFIG.rows;
        columnSlider.value = DEFAULT_CONFIG.cols;
        delaySlider.value = DEFAULT_CONFIG.delay;

        rowsInputField.value = DEFAULT_CONFIG.rows;
        columnInputField.value = DEFAULT_CONFIG.cols;
        delayInputField.value = DEFAULT_CONFIG.delay;
        reset();
    });

    // Interrupt Maze
    stopMazeButton.addEventListener("click", () => {
        stopInterval();
    });

    // Attach listeners to cells for interaction
    function attachCellListeners() {
        cells = MAZE_CONTAINER.querySelectorAll(".cell");

        cells.forEach((cell) => {
            // Start swipe
            cell.addEventListener("mousedown", (event) => {
                isSwiping = true;
                mouseMoved = false;
                event.preventDefault();
                if (cell.classList.contains("start") || cell.classList.contains("end")) return;
                cell.classList.toggle("clicked");
            });

            // Swipe over cells
            cell.addEventListener("mouseenter", () => {
                if (!isSwiping) return;
                if (cell.classList.contains("start") || cell.classList.contains("end")) return;
                cell.classList.add("clicked");
                mouseMoved = true;
            });
        });
    }

    // Stop swipe
    document.addEventListener("mouseup", () => {
        isSwiping = false;
    });
}

//#region Debug Functions
function inspectVariable(variable, name = "variable") {
    const type = typeof variable;

    let details = {
        name,
        type,
        value: variable,
        isArray: Array.isArray(variable),
        isNull: variable === null,
        isUndefined: variable === undefined,
        stringified: (() => {
            try {
                return JSON.stringify(variable);
            } catch {
                return "[Unserializable]";
            }
        })(),
    };

    // Extra info for special types
    if (type === "number") {
        details.isNaN = Number.isNaN(variable);
        details.isFinite = Number.isFinite(variable);
    }
    if (type === "string") {
        details.length = variable.length;
    }
    if (Array.isArray(variable)) {
        details.length = variable.length;
        details.sample = variable.slice(0, 5); // first 5 items
    }
    if (type === "object" && variable !== null) {
        details.keys = Object.keys(variable);
    }
    if (type === "function") {
        details.name = variable.name || "(anonymous)";
        details.argsCount = variable.length;
    }

    console.log(details);
}
