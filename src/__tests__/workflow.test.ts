import { Workflow } from "../workflow";
import { Context } from "../context";
import { Task, Middleware } from "../types";

describe("Workflow", () => {
  let workflow: Workflow;

  beforeEach(() => {
    workflow = new Workflow();
  });

  test("should handle conditional task execution", async () => {
    const taskId = workflow.addTask({
      name: "conditional-task",
      condition: (ctx) => ctx.get("shouldExecute") === true,
      execute: async () => "executed",
    }) as string; // Explicitly cast to string

    const skipResult = await workflow.execute(taskId, { shouldExecute: false });
    expect(skipResult).toBeNull();

    const executeResult = await workflow.execute(taskId, {
      shouldExecute: true,
    });
    expect(executeResult).toBe("executed");
  });

  test("should handle dynamic dependencies", async () => {
    const task1Id = workflow.addTask({
      name: "task1",
      execute: async (ctx) => {
        ctx.set("task1Done", true);
        return "task1";
      },
    }) as string; // Explicitly cast to string

    const task2Id = workflow.addTask({
      name: "task2",
      execute: async (ctx) => {
        ctx.set("task2Done", true);
        return "task2";
      },
    }) as string; // Explicitly cast to string

    const mainTaskId = workflow.addTask({
      name: "main",
      dependencies: (ctx): string[] => { // Explicit return type as string[]
        const deps: string[] = [];  // Ensure the deps array is of type string[]
        if (ctx.get("needsTask1")) deps.push(task1Id);
        if (ctx.get("needsTask2")) deps.push(task2Id);
        return deps;
      },
      execute: async (ctx) => {
        const results: string[] = [];  // Explicitly type results as string[]
        if (ctx.get("task1Done")) results.push("task1");
        if (ctx.get("task2Done")) results.push("task2");
        return results;
      },
    }) as string; // Explicitly cast to string

    const result1 = await workflow.execute(mainTaskId, { needsTask1: true });
    expect(result1).toEqual(["task1"]);

    const result2 = await workflow.execute(mainTaskId, {
      needsTask1: true,
      needsTask2: true,
    });
    expect(result2).toEqual(["task1", "task2"]);
  });
});

