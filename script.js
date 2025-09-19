const MAZE_CONTAINER = document.getElementById("maze-container");
const DEFAULT_CONFIG = {
    rows: 15,
    cols: 15,
    delay: 5,
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
    reset();
    setTimeout(() => {
        generateMaze();
    }, 1000);
});

//# Maze Generation
function generateMaze() {
    const rows = Number(localStorage.getItem("rows"));
    const cols = Number(localStorage.getItem("cols"));
    const delay = Number(localStorage.getItem("delay"));

    stopInterval();

    let stack = [];
    let largestStack = [];
    let currentIndex = selectRandomStartCell(rows, cols);
    markCellAsVisited(cells[currentIndex]);
    let iteration = 0;

    interval = setInterval(() => {
        const result = processMazeGenerationStep(currentIndex, stack, largestStack, rows, cols);
        currentIndex = result.currentIndex;
        stack = result.stack;
        largestStack = result.lgstStk;
        iteration++;
        if (iteration > MAX_ITERATIONS) {
            stopInterval();
            console.warn("Timeout");
        }
    }, delay);

    MAZE_CONTAINER.classList.remove("finish");

    console.log("Finished generating maze");
    return true;
}

function processMazeGenerationStep(currentIdx, stk, lgstStk, rows, cols) {
    const adjacentCellInfo = getRandomAdjacentCell(currentIdx, rows, cols);
    const adjacentCellIndex = adjacentCellInfo[0];
    const direction = adjacentCellInfo[1];

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
        highlightSolutionPath(lgstStk);
        stopInterval();
    }

    return {
        currentIndex: currentIdx,
        stack: stk,
        lgstStk: lgstStk,
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
        cells[currentIndex].style.setProperty("border-top", "transparent");
        cells[adjIndex].style.setProperty("border-bottom", "transparent");
    } else if (direction == DIRECTIONS.BOTTOM) {
        cells[currentIndex].style.setProperty("border-bottom", "transparent");
        cells[adjIndex].style.setProperty("border-top", "transparent");
    } else if (direction == DIRECTIONS.LEFT) {
        cells[currentIndex].style.setProperty("border-left", "transparent");
        cells[adjIndex].style.setProperty("border-right", "transparent");
    } else if (direction == DIRECTIONS.RIGHT) {
        cells[currentIndex].style.setProperty("border-right", "transparent");
        cells[adjIndex].style.setProperty("border-left", "transparent");
    }
}

function highlightSolutionPath(lgstStk) {
    let arr = lgstStk;
    arr.shift();
    arr.forEach((element) => {
        cell = cells[element];
        cell.classList.add("solution");
    });
}

//# Grid Management
function initializeGrid() {
    const rows = Number(localStorage.getItem("rows"));
    const cols = Number(localStorage.getItem("cols"));

    setGridDimensions(rows, cols);
    stopInterval();
    renderGrid(rows, cols);
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

    document.documentElement.style.setProperty("--rows", DEFAULT_CONFIG.rows);
    document.documentElement.style.setProperty("--cols", DEFAULT_CONFIG.cols);

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
    const generateMazeButton = document.querySelector("#generate-maze-button");
    const initializeMazeButton = document.querySelector("#initialize-maze-button");
    const resetButton = document.getElementById("reset-button");
    const stopMazeButton = document.getElementById("stop-maze-button");

    // getting max and min values
    const rowsSliderMax = Number(rowSlider.max);
    const colsSliderMax = Number(columnSlider.max);
    const delaySliderMax = Number(delaySlider.max);
    const rowsSliderMin = Number(rowSlider.min);
    const colsSliderMin = Number(columnSlider.min);
    const delaySliderMin = Number(delaySlider.min);

    let inputValue = 0;
    let rowValue = 0;
    let colValue = 0;
    let delayValue = 0;
    rowsInputField.value = rowSlider.value;
    columnInputField.value = columnSlider.value;
    delayInputField.value = delaySlider.value;

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
        delayInputField.value = inputValue;
        localStorage.setItem("delay", inputValue);
    });
    delayInputField.addEventListener("input", (event) => {
        inputValue = Number(event.target.value);
        if (inputValue > delaySliderMax) {
            delayInputField.value = delaySliderMax;
            delaySlider.value = delaySliderMax;
            localStorage.setItem("delay", delaySliderMax);
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
    // Initialize Grid
    initializeMazeButton.addEventListener("click", () => {
        initializeGrid();
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
