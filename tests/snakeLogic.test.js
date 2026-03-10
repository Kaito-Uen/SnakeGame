import assert from "node:assert/strict";

import {
  createFoodPosition,
  createInitialState,
  queueDirection,
  stepGame
} from "../src/snakeLogic.js";

const tests = [
  {
    name: "moves the snake one cell in its current direction",
    run() {
      const state = {
        gridSize: 8,
        snake: [{ x: 3, y: 3 }],
        direction: "right",
        food: { x: 0, y: 0 },
        score: 0,
        status: "running"
      };

      const next = stepGame(state);
      assert.deepEqual(next.snake, [{ x: 4, y: 3 }]);
      assert.equal(next.score, 0);
      assert.equal(next.status, "running");
    }
  },
  {
    name: "grows and increments score when the snake eats food",
    run() {
      const state = {
        gridSize: 8,
        snake: [
          { x: 3, y: 3 },
          { x: 2, y: 3 }
        ],
        direction: "right",
        food: { x: 4, y: 3 },
        score: 0,
        status: "running"
      };

      const next = stepGame(state, { randomFn: () => 0 });
      assert.deepEqual(next.snake, [
        { x: 4, y: 3 },
        { x: 3, y: 3 },
        { x: 2, y: 3 }
      ]);
      assert.equal(next.score, 1);
      assert.ok(next.food);
    }
  },
  {
    name: "ends the game when the snake hits a wall",
    run() {
      const state = {
        gridSize: 4,
        snake: [{ x: 3, y: 1 }],
        direction: "right",
        food: { x: 0, y: 0 },
        score: 0,
        status: "running"
      };

      const next = stepGame(state);
      assert.equal(next.status, "over");
    }
  },
  {
    name: "ends the game when the snake hits its body",
    run() {
      const state = {
        gridSize: 6,
        snake: [
          { x: 2, y: 2 },
          { x: 2, y: 3 },
          { x: 1, y: 3 },
          { x: 1, y: 2 }
        ],
        direction: "down",
        food: { x: 0, y: 0 },
        score: 0,
        status: "running"
      };

      const next = stepGame(state);
      assert.equal(next.status, "over");
    }
  },
  {
    name: "prevents reversing direction when the snake has more than one segment",
    run() {
      const state = {
        gridSize: 8,
        snake: [
          { x: 3, y: 3 },
          { x: 2, y: 3 }
        ],
        direction: "right",
        food: { x: 0, y: 0 },
        score: 0,
        status: "running"
      };

      assert.equal(queueDirection(state, "left"), "right");
      assert.equal(queueDirection(state, "up"), "up");
    }
  },
  {
    name: "places food on an open cell only",
    run() {
      const food = createFoodPosition(
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 0, y: 1 }
        ],
        2,
        () => 0
      );

      assert.deepEqual(food, { x: 1, y: 1 });
    }
  },
  {
    name: "initial state starts ready with food off the snake",
    run() {
      const state = createInitialState({ gridSize: 6, randomFn: () => 0 });
      assert.equal(state.status, "ready");
      assert.equal(state.snake.length, 1);
      assert.notDeepEqual(state.snake[0], state.food);
    }
  }
];

let failures = 0;

for (const entry of tests) {
  try {
    entry.run();
    console.log(`PASS ${entry.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${entry.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`All ${tests.length} tests passed.`);
}