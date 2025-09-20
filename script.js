const MAZE_CONTAINER = document.getElementById("maze-container");
// Assuming square container
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

var cells = [];
var interval = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeGrid();
    cells = MAZE_CONTAINER.querySelectorAll(".cell");
    setTimeout(() => {
        generateMaze();
    }, 1000);
});

//# Maze Generation
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

    MAZE_CONTAINER.classList.remove("finish");

    console.log("Finished generating maze");
    return true;
}

function processMazeGenerationStep(currentIdx, stk, lgstStk, rows, cols) {
    const adjacentCellInfo = getRandomAdjacentCell(currentIdx, rows, cols);
    const adjacentCellIndex = adjacentCellInfo[0];
    const direction = adjacentCellInfo[1];

    let isFinished = false;

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
        // highlightPath(lgstStk);
        isFinished = true;
    }

    return {
        currentIndex: currentIdx,
        stack: stk,
        lgstStk: lgstStk,
        isFinished: isFinished,
    };
}

function getRandomAdjacentCell(cellIndex, rows, cols) {
    let adjacentCellIndices = [];

    const topIndex = cellIndex - cols;
    const bottomIndex = cellIndex + cols;
    const leftIndex = cellIndex - 1;
    const rightIndex = cellIndex + 1;
    let direction;

    // Top
    if (cellIndex >= cols && !hasCellBeenVisited(cells[topIndex])) {
        adjacentCellIndices.push(topIndex);
    }
    // Bottom
    if (cellIndex < (rows - 1) * cols && !hasCellBeenVisited(cells[bottomIndex])) {
        adjacentCellIndices.push(bottomIndex);
    }
    // Left
    if (cellIndex % cols != 0 && !hasCellBeenVisited(cells[leftIndex])) {
        adjacentCellIndices.push(leftIndex);
    }
    // Right
    if (cellIndex % cols != cols - 1 && !hasCellBeenVisited(cells[rightIndex])) {
        adjacentCellIndices.push(rightIndex);
    }

    const randomIndex = Math.floor(Math.random() * adjacentCellIndices.length);
    const chosenAdjacentCellIndex = adjacentCellIndices[randomIndex];

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

function toggleHighlightPath(stack) {
    let isPathHighlighted = localStorage.getItem("isPathHighlighted") == "true" ? true : false;
    let path = stack.slice();
    path.shift();

    isPathHighlighted = !isPathHighlighted;
    localStorage.setItem("isPathHighlighted", isPathHighlighted);

    let i = 0;
    path.forEach((cellIdx) => {
        cell = cells[cellIdx];
        if (isPathHighlighted) {
            cell.classList.add("solution");
            cell.style.setProperty("--anim-delay", i);
        } else {
            cell.classList.remove("solution");
        }
        i++;
    });
}

function checkIfSolved(stack) {
    cells = MAZE_CONTAINER.querySelectorAll(".cell");
    const solutionPath = stack.slice();
    solutionPath.shift();

    const solutionPathClicked = solutionPath.every((pathIdx) => cells[pathIdx].classList.contains("clicked"));

    const noExtraClicks = Array.from(cells).every((cell, idk) => {
        if (cell.classList.contains("clicked")) {
            return solutionPath.includes(idk);
        }
        return true;
    });

    return solutionPathClicked && noExtraClicks;
}

//# Grid Management
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

function adjustGridSize(rows, cols) {
    const cellSize = Math.floor(MAX_CONTAINER_SIZE / Math.max(rows, cols));

    const width = cellSize * cols;
    const height = cellSize * rows;

    MAZE_CONTAINER.style.setProperty("--maze-width", width + "px");
    MAZE_CONTAINER.style.setProperty("--maze-height", height + "px");

    MAZE_CONTAINER.style.aspectRatio = "";
}

function setGridDimensions(rows, cols) {
    document.documentElement.style.setProperty("--rows", rows);
    document.documentElement.style.setProperty("--cols", cols);
}

//# Cell Management
function selectRandomStartCell(rows, cols) {
    const randomIndex = Math.floor(Math.random() * rows * cols);
    const cell = cells[randomIndex];
    cell.classList.add("start");
    return randomIndex;
}

function hasCellBeenVisited(cell) {
    return cell.dataset.isVisited == "true";
}

function markCellAsVisited(cell) {
    cell.dataset.isVisited = "true";
    cell.classList.add("visited");
}
function getCell(cellIndex) {
    return cells[cellIndex];
}

//# Control
function stopInterval() {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
}

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

//# UI Event Handlers
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

    // Setting stored values

    const rows = Number(localStorage.getItem("rows") == null ? DEFAULT_CONFIG.rows : localStorage.getItem("rows"));
    const cols = Number(localStorage.getItem("cols") == null ? DEFAULT_CONFIG.cols : localStorage.getItem("cols"));
    const delay = Number(localStorage.getItem("delay") == null ? DEFAULT_CONFIG.delay : localStorage.getItem("delay"));
    rowsInputField.value = rows;
    columnInputField.value = cols;
    delayInputField.value = delay;
    rowSlider.value = rows;
    columnSlider.value = cols;
    delaySlider.value = delay;

    let inputValue = 0;
    // Update the Rows value
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

    // Update the Columns value
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

    // Update the Delay value
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

    // Check if Maze is solved bt uses
    checkMazeButton.addEventListener("click", () => {
        if (checkIfSolved(this.solution)) {
            MAZE_CONTAINER.classList.add("solved");
        }
    });

    // Show solution Grid
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
    // Stop Maze
    stopMazeButton.addEventListener("click", () => {
        stopInterval();
    });

    MAZE_CONTAINER.addEventListener("click", (event) => {
        const cell = event.target.closest(".cell");
        if (cell) {
            if (cell.classList.contains("clicked")) {
                cell.classList.remove("clicked");
            } else {
                cell.classList.add("clicked");
            }
        }
    });
}

//# Debug Functions
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
