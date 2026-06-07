<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FormController;
use App\Http\Controllers\FormResponseController;
use App\Http\Controllers\FormSectionController;
use App\Http\Controllers\SectionOptionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

Route::prefix("/auth")->group(function () {
    Route::post('/register', [AuthController::class, "register"]);
    Route::post('/login', [AuthController::class, "login"]);
    Route::post('/logout', [AuthController::class, "logout"])->middleware("auth:sanctum");
});

Route::middleware("auth:sanctum")->group(function () {
    //forms
    Route::post('/forms', [FormController::class, "store"]);
    Route::put('/forms/{slug}', [FormController::class, "update"]);
    Route::delete('/forms/{slug}', [FormController::class, "destroy"]);
    Route::get('/forms/{slug}', [FormController::class, "show"]);
    Route::get('/forms', [FormController::class, "index"]);

    //form sections
    Route::post("/forms/{slug}/sections", [FormSectionController::class, "store"]);
    Route::put("/forms/{slug}/sections/{id}", [FormSectionController::class, "update"]);
    Route::put("/forms/{slug}/reorder", [FormSectionController::class, "reorder"]);
    Route::delete("/forms/{slug}/sections/{id}", [FormSectionController::class, "destroy"]);

    //options
    Route::post("/sections/{id}/options", [SectionOptionController::class, "store"]);
    Route::put("/sections/{id}/options", [SectionOptionController::class, "update"]);
    Route::delete("/sections/{id}/options/{optId}", [SectionOptionController::class, "destroy"]);

    Route::get("/forms/{slug}/summary", [FormResponseController::class, "summary"]);
});

//form submitting
Route::post("/forms/{slug}/submit", [FormResponseController::class, "store"]);
Route::get("/forms/{slug}/result/{responseId}", [FormResponseController::class, "show"]);
