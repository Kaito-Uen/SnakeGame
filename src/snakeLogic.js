export const GRID_SIZE = 16;
export const TICK_MS = 140;

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const START_DIRECTION = "right";

export function createInitialState({ gridSize = GRID_SIZE, randomFn = Math.random } = {}) {
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

export function queueDirection(state, nextDirection) {
  if (!DIRECTIONS[nextDirection]) {
    return state.direction;
  }

  if (state.snake.length > 1 && isOppositeDirection(state.direction, nextDirection)) {
    return state.direction;
  }

  return nextDirection;
}

export function stepGame(state, { randomFn = Math.random } = {}) {
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
    ? [nextHead, ...state.snake]
    : [nextHead, ...state.snake.slice(0, -1)];

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

export function createFoodPosition(snake, gridSize, randomFn = Math.random) {
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

export function isOppositeDirection(currentDirection, nextDirection) {
  const current = DIRECTIONS[currentDirection];
  const next = DIRECTIONS[nextDirection];
  return current.x + next.x === 0 && current.y + next.y === 0;
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