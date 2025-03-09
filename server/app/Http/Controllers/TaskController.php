<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'rice_land_id' => 'required|exists:rice_lands,id',
        ]);

        // Fetch tasks for the given date and rice_land_id
        $tasks = Task::where('date', $request->date)
            ->where('rice_land_id', $request->rice_land_id)
            ->with('riceLand')
            ->get();

        // Flatten the tasks array
        $flattenedTasks = $tasks->flatMap(function ($task) {
            // Decode the JSON string into an array
            $decodedTasks = json_decode($task->task, true);

            // Map each task to include the original task ID, date, and rice_land_id
            return array_map(function ($taskItem) use ($task) {
                return [
                    'id' => $task->id,
                    'rice_land_name' => $task->riceLand->rice_land_name,
                    'task' => $taskItem,
                    'date' => $task->date,
                    'rice_land_id' => $task->rice_land_id,
                ];
            }, $decodedTasks);
        });

        return response()->json($flattenedTasks, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tasks' => 'required|array', // Validate that 'tasks' is an array
            'tasks.*' => 'required|string|max:255', // Validate each task in the array
            'date' => 'required|date',
            'rice_land_id' => 'required|exists:rice_lands,id',
        ]);

        // Convert the tasks array to JSON
        $tasksJson = json_encode($request->tasks);

        // Create a single record with the tasks stored as JSON
        $task = Task::create([
            'task' => $tasksJson, // Store tasks as JSON
            'date' => $request->date,
            'rice_land_id' => $request->rice_land_id,
        ]);

        return response()->json($task, 200);
    }

    public function update(Request $request)
    {
        $request->validate([
            'tasks' => 'required|array',
            'tasks.*' => 'required|string|max:255',
            'date' => 'required|date',
            'rice_land_id' => 'required|exists:rice_lands,id',
        ]);

        $task = Task::findOrFail($request->rice_land_id);
        $task->update([
            'task' => json_encode($request->tasks),
            'date' => $request->date,
            'rice_land_id' => $request->rice_land_id,
        ]);

        return response()->json(['message' => 'Tasks updated successfully', 'task' => $task], 200);
    }

    // Delete a task
    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }
}
