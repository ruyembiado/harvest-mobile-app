<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AICoontroller;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\AdvisoryController;
use App\Http\Controllers\RiceLandController;
use App\Http\Controllers\RiceVarietyController;
use App\Http\Controllers\RiceGrowthStageController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Authentcation
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::get('/get_profile/{id}', [AuthController::class, 'get_profile']);
Route::post('/update_profile/{id}', [AuthController::class, 'update_profile']);

// Rice Lands
Route::post('/add_rice_land', [RiceLandController::class, 'add_rice_land']);
Route::post('/rice_lands', [RiceLandController::class, 'get_rice_lands_by_user_id']);
Route::get('/get_rice_land/{id}', [RiceLandController::class, 'get_rice_land']);
Route::post('/update_rice_land', [RiceLandController::class, 'update_rice_land']);
Route::delete('/delete_rice_land', [RiceLandController::class, 'delete_rice_land_by_id']);
Route::post('/update_rice_land_stage_today', [RiceLandController::class, 'update_rice_land_stage']);

// Rice Varieties
Route::post('/add_rice_variety', [RiceVarietyController::class, 'add_rice_variety']);
Route::get('/get_rice_variety/{id}', [RiceVarietyController::class, 'get_variety_by_rice_land_id']);
Route::delete('/delete_rice_variety', [RiceVarietyController::class, 'delete_rice_land_by_id']);

// AI
Route::post('/generate_stage_growth_schedule', [AICoontroller::class, 'generate_stage_growth_schedule']);
Route::post('/generate_advisories', [AICoontroller::class, 'generate_advisories']);
Route::post('/ask_question', [AICoontroller::class, 'ask_question']);

// Rice Growth Stages
Route::get('/get_rice_growth_stages/{rice_land_id}', [RiceGrowthStageController::class, 'get_rice_land_stages_by_land_id']);

// Advisories
Route::get('/get_advisories_today/{rice_land_id}/{date}', [AdvisoryController::class, 'get_advisories_today_by_land_id']);
Route::get('/get_all_advisories/{rice_land_id}', [AdvisoryController::class, 'get_all_advisories_by_land_id']);

// Notes
Route::get('/get_notes/{rice_land_id}', [NoteController::class, 'index']);
Route::post('/add_note', [NoteController::class, 'store']);
Route::delete('/delete_note/{note}', [NoteController::class, 'destroy']);
Route::get('/get_note/{id}', [NoteController::class, 'get_note']);
Route::post('/update_note/{id}', [NoteController::class, 'update']);

// Tasks
Route::get('get_task/', [TaskController::class, 'index']); 
Route::post('add_tasks/', [TaskController::class, 'store']); 
Route::delete('delete_task/{id}', [TaskController::class, 'destroy']); 
Route::post('update_tasks/', [TaskController::class, 'update']);