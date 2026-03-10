const GRID_SIZE = 16;
const TICK_MS = 140;
const SWIPE_THRESHOLD = 24;

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const START_DIRECTION = "right";

function createFoodPosition(snake, gridSize, randomFn) {
  const occupied = new Set(snake.map(toKey));
  const openCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const candidate = { x, y };
      if (!occupied.has(toKey(candidate))) {
        openCells.push(candidate);
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  const index = Math.min(openCells.length - 1, Math.floor(randomFn() * openCells.length));
  return openCells[index];
}

function createInitialState(options) {
  const settings = options || {};
  const gridSize = settings.gridSize || GRID_SIZE;
  const randomFn = settings.randomFn || Math.random;
  const start = { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) };
  const snake = [start];

  return {
    gridSize,
    snake,
    direction: START_DIRECTION,
    food: createFoodPosition(snake, gridSize, randomFn),
    score: 0,
    status: "ready"
  };
}

function isOppositeDirection(currentDirection, nextDirection) {
  const current = DIRECTIONS[currentDirection];
  const next = DIRECTIONS[nextDirection];
  return current.x + next.x === 0 && current.y + next.y === 0;
}

function queueDirection(state, nextDirection) {
  if (!DIRECTIONS[nextDirection]) {
    return state.direction;
  }

  if (state.snake.length > 1 && isOppositeDirection(state.direction, nextDirection)) {
    return state.direction;
  }

  return nextDirection;
}

function stepGame(state, options) {
  const settings = options || {};
  const randomFn = settings.randomFn || Math.random;

  if (state.status !== "running") {
    return state;
  }

  const movement = DIRECTIONS[state.direction];
  const currentHead = state.snake[0];
  const nextHead = {
    x: currentHead.x + movement.x,
    y: currentHead.y + movement.y
  };

  if (isOutOfBounds(nextHead, state.gridSize)) {
    return { ...state, status: "over" };
  }

  const willEat = positionsEqual(nextHead, state.food);
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);

  if (bodyToCheck.some((segment) => positionsEqual(segment, nextHead))) {
    return { ...state, status: "over" };
  }

  const snake = willEat
    ? [nextHead].concat(state.snake)
    : [nextHead].concat(state.snake.slice(0, -1));

  const score = willEat ? state.score + 1 : state.score;
  const food = willEat ? createFoodPosition(snake, state.gridSize, randomFn) : state.food;
  const status = food ? "running" : "won";

  return {
    ...state,
    snake,
    food,
    score,
    status
  };
}

function isOutOfBounds(position, gridSize) {
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= gridSize ||
    position.y >= gridSize
  );
}

function positionsEqual(a, b) {
  return a && b && a.x === b.x && a.y === b.y;
}

function toKey(position) {
  return `${position.x}:${position.y}`;
}

const boardElement = document.querySelector("#game-board");
const scoreElement = document.querySelector("#score");
const statusElement = document.querySelector("#status");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const controlsElement = document.querySelector(".controls");

let state = createInitialState();
let queuedDirection = state.direction;
let timerId = null;
let touchSession = null;

boardElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
draw();

function startLoop() {
  stopLoop();
  timerId = window.setInterval(() => {
    state = stepGame(state);
    draw();

    if (state.status === "over" || state.status === "won") {
      stopLoop();
    }
  }, TICK_MS);
}

function stopLoop() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function setDirection(direction) {
  const nextDirection = queueDirection(state, direction);
  queuedDirection = nextDirection;

  if (state.status === "ready") {
    state = { ...state, status: "running", direction: nextDirection };
    startLoop();
    draw();
    return;
  }

  if (state.status === "paused" || state.status === "running") {
    state = { ...state, direction: nextDirection, status: "running" };
    if (timerId === null) {
      startLoop();
    }
    draw();
  }
}

function togglePause() {
  if (state.status === "over" || state.status === "won" || state.status === "ready") {
    return;
  }

  if (state.status === "paused") {
    state = { ...state, status: "running" };
    startLoop();
  } else {
    state = { ...state, status: "paused" };
    stopLoop();
  }

  draw();
}

function restartGame() {
  state = createInitialState();
  queuedDirection = state.direction;
  stopLoop();
  draw();
}

function draw() {
  boardElement.replaceChildren(...buildCells());
  scoreElement.textContent = String(state.score);
  pauseButton.textContent = state.status === "paused" ? "Resume" : "Pause";
  statusElement.textContent = getStatusMessage();
}

function buildCells() {
  const snakeMap = new Map(
    state.snake.map((segment, index) => [`${segment.x}:${segment.y}`, index === 0 ? "head" : "body"])
  );
  const cells = [];

  for (let y = 0; y < state.gridSize; y += 1) {
    for (let x = 0; x < state.gridSize; x += 1) {
      const cell = document.createElement("div");
      const key = `${x}:${y}`;
      cell.className = "cell";

      if (snakeMap.has(key)) {
        cell.classList.add("cell--snake");
        if (snakeMap.get(key) === "head") {
          cell.classList.add("cell--head");
        }
      } else if (state.food && state.food.x === x && state.food.y === y) {
        cell.classList.add("cell--food");
      }

      cells.push(cell);
    }
  }

  return cells;
}

function getStatusMessage() {
  if (state.status === "ready") {
    return "Arrow keys, WASD, buttons, or swipe to start.";
  }

  if (state.status === "paused") {
    return "Game paused.";
  }

  if (state.status === "over") {
    return "Game over. Restart to play again.";
  }

  if (state.status === "won") {
    return "Board cleared. Restart to play again.";
  }

  return `Moving ${queuedDirection}. Tap Pause or swipe to turn.`;
}

window.addEventListener("keydown", (event) => {
  const direction = keyToDirection(event.key);

  if (direction) {
    event.preventDefault();
    setDirection(direction);
    return;
  }

  if (event.key === " ") {
    event.preventDefault();
    togglePause();
  }
});

controlsElement.addEventListener("click", (event) => {
  const button = event.target.closest("[data-direction]");
  if (!button) {
    return;
  }

  setDirection(button.dataset.direction);
});

boardElement.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchSession = {
    id: touch.identifier,
    x: touch.clientX,
    y: touch.clientY
  };
}, { passive: true });

window.addEventListener("touchend", handleTouchFinish, { passive: false });
window.addEventListener("touchcancel", clearTouchSession, { passive: true });

pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartGame);

function handleTouchFinish(event) {
  if (!touchSession) {
    return;
  }

  const touch = findTouch(event.changedTouches, touchSession.id);
  if (!touch) {
    return;
  }

  const deltaX = touch.clientX - touchSession.x;
  const deltaY = touch.clientY - touchSession.y;
  const direction = swipeToDirection(deltaX, deltaY);
  clearTouchSession();

  if (direction) {
    event.preventDefault();
    setDirection(direction);
  }
}

function clearTouchSession() {
  touchSession = null;
}

function findTouch(touchList, identifier) {
  for (let index = 0; index < touchList.length; index += 1) {
    if (touchList[index].identifier === identifier) {
      return touchList[index];
    }
  }

  return null;
}

function keyToDirection(key) {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return "up";
    case "ArrowDown":
    case "s":
    case "S":
      return "down";
    case "ArrowLeft":
    case "a":
    case "A":
      return "left";
    case "ArrowRight":
    case "d":
    case "D":
      return "right";
    default:
      return null;
  }
}

function swipeToDirection(deltaX, deltaY) {
  if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
    return null;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? "right" : "left";
  }

  return deltaY > 0 ? "down" : "up";
}