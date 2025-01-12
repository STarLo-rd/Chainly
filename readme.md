# Chainly SDK

A TypeScript SDK for orchestrating workflows with complex task dependencies, automating task execution, and providing advanced error handling. Chainly helps developers focus on building business logic by simplifying workflow management.

## Features

- **Automated Task Execution**: Automates the order and execution of tasks based on defined dependencies.
- **Dependency Management**: Resolves task dependencies and ensures tasks are executed in the correct order.
- **Context Propagation**: Smooth data transitions between tasks to ensure accurate execution.
- **Conditional Branching**: Dynamically adapts workflows based on runtime data.
- **Extensible Middleware**: Integrates custom pre/post-task logic for enhanced flexibility.
- **Event-Driven Execution**: Reacts to real-time events to trigger tasks.
- **Nested Workflows**: Breaks down complex workflows into manageable, reusable units.
- **Retries & Error Handling**: Resilient workflows with automatic retries and detailed error handling.
- **Decoupling Business Logic and Infrastructure**: Separates business logic from infrastructure concerns to enhance clarity.

## Installation

```bash
npm install chainly-sdk
```

## Technical Overview

Chainly SDK is designed to streamline the creation and management of workflows. It allows for smooth task orchestration by handling dependencies, context propagation, and error management. The SDK is highly flexible and can be easily integrated into any TypeScript-based application.

### Core Components

#### Workflow Class

Manages the lifecycle of workflows:

- Task dependency resolution
- Workflow initiation and completion
- Task execution based on pre-defined rules
- Context propagation across tasks
- Conditional task branching

#### Task

Represents individual tasks within a workflow:

- Task execution logic
- Dependency management
- Error handling and retries

#### Middleware

Custom logic that runs before or after task execution:

- Logging
- Security checks
- Monitoring

## Backend Integration Guide

### Setup

```typescript
import { Workflow, Task } from "chainly-sdk";

const myWorkflow = new Workflow();

// Define tasks with dependencies
const task1 = new Task("task1", () => {
  console.log("Task 1 completed");
});

const task2 = new Task("task2", () => {
  console.log("Task 2 completed");
});

myWorkflow.addTask(task1);
myWorkflow.addTask(task2);

// Set task dependencies
task2.addDependency(task1);

// Execute workflow
myWorkflow.run();
```

### Event-Driven Execution

Chainly allows tasks to be triggered based on real-time events:

```typescript
import { Workflow, EventDrivenTask } from "chainly-sdk";

const eventTask = new EventDrivenTask("eventTask", (eventData) => {
  console.log("Received event:", eventData);
});

eventTask.on("taskTriggered", (eventData) => {
  // Trigger task based on event
  eventTask.execute(eventData);
});
```

### Error Handling

Automatically handles errors and retries tasks when necessary:

```typescript
import { Workflow, Task } from "chainly-sdk";

const myWorkflow = new Workflow();

const taskWithRetry = new Task("taskWithRetry", () => {
  // Task logic here
  if (Math.random() > 0.5) throw new Error("Task failed");
  console.log("Task completed successfully");
});

// Retry on failure
taskWithRetry.onError(() => {
  console.log("Retrying task...");
});

myWorkflow.addTask(taskWithRetry);
myWorkflow.run();
```

### API Implementation Example

```typescript
import express from "express";
import { Workflow, Task } from "chainly-sdk";

const app = express();

app.post("/create-workflow", async (req, res) => {
  const { taskData } = req.body;

  const myWorkflow = new Workflow();
  const task1 = new Task("task1", () => {
    console.log("Executing Task 1");
  });

  myWorkflow.addTask(task1);
  myWorkflow.run();

  return res.json({ status: "Workflow initiated" });
});

app.post("/execute-task", async (req, res) => {
  const { taskName } = req.body;

  const task = myWorkflow.getTask(taskName);
  await task.execute();

  return res.json({ status: `Task ${taskName} executed` });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## Security

- Ensures secure task execution by validating dependencies and context propagation.
- Uses best practices for error handling and state validation to prevent security breaches.
- Offers extensibility for integrating custom security measures.

## Error Handling

Chainly provides a robust error handling system with:

- Automatic retries on task failure
- Clear error messages with detailed context
- Type-safe error handling for better reliability
- Validation checks on task dependencies
