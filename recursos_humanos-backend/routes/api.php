<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EmployeeStateController;
use App\Http\Controllers\EmployeeDetailController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\WorkSessionController;
use App\Http\Controllers\EarlyDepartureRequestController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\Auth\AuthController;

// Ruta de diagnóstico (health check)
Route::get('/health', function() {
    return response()->json([
        'status' => 'ok',
        'message' => 'El servidor está funcionando correctamente',
        'timestamp' => now()->toIso8601String()
    ]);
});

// Rutas públicas de autenticación
Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');

// Rutas protegidas con autenticación
Route::middleware('auth:sanctum')->group(function () {
    // Rutas de autenticación
    Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
    Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');
    
    // Rutas para empleados (requieren autenticación)
    Route::prefix('employee')->group(function () {
        // Perfil y datos personales
        Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'show']);
        Route::put('/profile', [App\Http\Controllers\ProfileController::class, 'update']);
        
        // Documentos personales
        Route::get('/documents', [DocumentController::class, 'showByUser']);
        Route::post('/documents', [DocumentController::class, 'uploadForEmployee']);
        Route::get('/documents/{id}/download', [DocumentController::class, 'download']);
        Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);
        
        // Marcaciones de entrada/salida
        Route::get('/attendance', [WorkSessionController::class, 'showByUser']);
        Route::post('/attendance/start', [WorkSessionController::class, 'startWork']);
        Route::post('/attendance/end', [WorkSessionController::class, 'endWork']);
        Route::post('/attendance/lunch-start', [WorkSessionController::class, 'startLunch']);
        Route::post('/attendance/lunch-end', [WorkSessionController::class, 'endLunch']);
        
        // Solicitudes de salida anticipada
        Route::apiResource('early-departure-requests', EarlyDepartureRequestController::class)
            ->only(['index', 'store', 'show']);
    });
    
    // Rutas solo para administradores
    Route::prefix('admin')->middleware(\App\Http\Middleware\RoleMiddleware::class . ':admin')->group(function () {
        // Gestión de usuarios y empleados
        Route::apiResource('users', UserController::class);
        Route::apiResource('employee-states', EmployeeStateController::class);
        Route::apiResource('employee-details', EmployeeDetailController::class);
        
        // Gestión de estructura organizacional
        Route::apiResource('companies', CompanyController::class);
        Route::apiResource('branches', BranchController::class);
        Route::apiResource('departments', DepartmentController::class);
        Route::apiResource('roles', RoleController::class);
        
        // Gestión de horarios y asistencia
        Route::apiResource('schedules', ScheduleController::class);
        Route::get('attendance/all', [WorkSessionController::class, 'index']);
        Route::get('attendance/user/{id}', [WorkSessionController::class, 'showUserAttendance']);
        
        // Gestión de documentos
        Route::apiResource('documents', DocumentController::class);
        Route::get('documents/{id}/download', [DocumentController::class, 'download']);
        
        // Gestión de solicitudes de salida anticipada
        Route::get('early-departure-requests', [EarlyDepartureRequestController::class, 'index']);
        Route::put('early-departure-requests/{id}/approve', [EarlyDepartureRequestController::class, 'approve']);
        Route::put('early-departure-requests/{id}/reject', [EarlyDepartureRequestController::class, 'reject']);
        Route::get('early-departure-requests/{id}', [EarlyDepartureRequestController::class, 'show']);
        Route::put('early-departure-requests/{id}', [EarlyDepartureRequestController::class, 'update']);
        Route::delete('early-departure-requests/{id}', [EarlyDepartureRequestController::class, 'destroy']);
    });
});

