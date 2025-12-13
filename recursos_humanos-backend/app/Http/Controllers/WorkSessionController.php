<?php

namespace App\Http\Controllers;

use App\Models\WorkSession;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;


class WorkSessionController extends Controller
{
    /**
     * Muestra una lista de las sesiones de trabajo.
     */
    public function index()
    {
        //
        $workSessions = WorkSession::with('user')->get();
        return response()->json([
            'status' => true,
            'message' => $workSessions->isEmpty() ? 'No se encontraron sesiones de trabajo' : 'Lista de sesiones de trabajo',
            'data' => $workSessions
        ], 200);
    }

    /**
     * Guarda una nueva sesión de trabajo.
     */
    public function store(Request $request)
    {
        //
        try {
            $request->validate([
                'user_id' => 'required|exists:users,user_id',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
                'lunch_start' => 'nullable|date_format:H:i|after:start_time',
                'lunch_end' => 'nullable|date_format:H:i|after:lunch_start',
                'created_by' => 'nullable|exists:users,user_id',

            ]);

            $workSession = WorkSession::create($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Sesión de trabajo creada con éxito',
                'data' => $workSession
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al crear la sesión de trabajo: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Muestra la sesión de trabajo por id.
     */
    public function show($id)
    {
        //
        try {
            $workSession = WorkSession::with('user')->findOrFail($id);
            return response()->json([
                'status' => true,
                'message' => 'Sesión de trabajo encontrada',
                'data' => $workSession
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Sesión de trabajo no encontrada',
            ], 404);
        }
    }


    /**
     * Actualiza la sesión de trabajo por id.
     */
    public function update(Request $request, $id)
    {
        //
        try {
            $workSession = WorkSession::findOrFail($id);

            $request->validate([
                'user_id' => 'sometimes|exists:users,user_id',
                'start_time' => 'sometimes|date_format:H:i',
                'end_time' => 'sometimes|date_format:H:i|after:start_time',
                'lunch_start' => 'nullable|date_format:H:i|after:start_time',
                'lunch_end' => 'nullable|date_format:H:i|after:lunch_start',
                'created_by' => 'nullable|exists:users,user_id',
            ]);

            $workSession->update($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Sesión de trabajo actualizada con éxito',
                'data' => $workSession
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Sesión de trabajo no encontrada',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al actualizar la sesión de trabajo: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Elimina una sesión de trabajo por id.
     */
    public function destroy($id)
    {
        //
        try {
            $workSession = WorkSession::findOrFail($id);
            $workSession->delete();

            return response()->json([
                'status' => true,
                'message' => 'Sesión de trabajo eliminada con éxito',
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Sesión de trabajo no encontrada',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al eliminar la sesión de trabajo: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Muestra las sesiones de trabajo de un usuario específico.
     */
    public function showByUser(Request $request)
    {
        $userId = $request->user()->user_id;
        
        $workSessions = WorkSession::where('user_id', $userId)
            ->orderBy('work_date', 'desc')
            ->get();

        if ($workSessions->isEmpty()) {
            return response()->json([
                'status' => true,
                'message' => 'No se encontraron sesiones de trabajo para este usuario',
                'data' => []
            ], 200);
        }

        return response()->json([
            'status' => true,
            'message' => 'Sesiones de trabajo del usuario',
            'data' => $workSessions
        ], 200);
    }

    /**
     * Registra el inicio de la jornada laboral del usuario.
     */
    public function startWork(Request $request)
    {
        try {
            \Log::info('StartWork llamado', ['user' => $request->user()->user_id]);
            
            // Validar datos de entrada
            $request->validate([
                'latitude' => 'nullable|string',
                'longitude' => 'nullable|string',
            ]);
            
            \Log::info('Validación exitosa');
            
            $userId = $request->user()->user_id;
            $currentDate = now()->format('Y-m-d');
            
            \Log::info('Datos obtenidos', ['userId' => $userId, 'currentDate' => $currentDate]);
            
            // Verificar si ya existe una sesión para hoy
            $existingSession = WorkSession::where('user_id', $userId)
                ->where('work_date', $currentDate)
                ->first();
                
            \Log::info('Verificación de sesión existente', ['existingSession' => $existingSession ? 'encontrada' : 'no encontrada']);
                
            if ($existingSession) {
                \Log::info('Sesión ya existe, devolviendo error');
                return response()->json([
                    'status' => false,
                    'message' => 'Ya has registrado tu entrada hoy'
                ], 400);
            }

            \Log::info('Creando nueva sesión de trabajo');
            
            $sessionData = [
                'user_id' => $userId,
                'work_date' => $currentDate,
                'start_time' => now()->format('H:i'),
                'latitude' => $request->input('latitude'),
                'longitude' => $request->input('longitude'),
                'created_by' => $userId
            ];
            
            \Log::info('Datos de sesión preparados', $sessionData);

            $workSession = WorkSession::create($sessionData);
            
            \Log::info('Sesión creada exitosamente', ['sessionId' => $workSession->session_id]);

            return response()->json([
                'status' => true,
                'message' => 'Entrada registrada exitosamente',
                'data' => $workSession
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error en startWork', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'status' => false,
                'message' => 'Error al registrar la entrada: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registra la salida al almuerzo del usuario.
     */
    public function startLunch(Request $request)
    {
        $userId = $request->user()->user_id;
        $currentDate = now()->format('Y-m-d');
        
        $workSession = WorkSession::where('user_id', $userId)
            ->where('work_date', $currentDate)
            ->first();
            
        if (!$workSession) {
            return response()->json([
                'status' => false,
                'message' => 'No has registrado tu entrada hoy'
            ], 400);
        }
        
        if ($workSession->lunch_start) {
            return response()->json([
                'status' => false,
                'message' => 'Ya has registrado tu salida al almuerzo'
            ], 400);
        }

        $workSession->update([
            'lunch_start' => now()->format('H:i')
        ]);

        // Refresh the model to get updated data
        $workSession->refresh();

        return response()->json([
            'status' => true,
            'message' => 'Salida al almuerzo registrada exitosamente',
            'data' => $workSession
        ]);
    }

    /**
     * Registra el regreso del almuerzo del usuario.
     */
    public function endLunch(Request $request)
    {
        $userId = $request->user()->user_id;
        $currentDate = now()->format('Y-m-d');
        
        $workSession = WorkSession::where('user_id', $userId)
            ->where('work_date', $currentDate)
            ->first();
            
        if (!$workSession || !$workSession->lunch_start) {
            return response()->json([
                'status' => false,
                'message' => 'No has registrado tu salida al almuerzo'
            ], 400);
        }
        
        if ($workSession->lunch_end) {
            return response()->json([
                'status' => false,
                'message' => 'Ya has registrado tu regreso del almuerzo'
            ], 400);
        }

        $workSession->update([
            'lunch_end' => now()->format('H:i')
        ]);

        // Refresh the model to get updated data
        $workSession->refresh();

        return response()->json([
            'status' => true,
            'message' => 'Regreso del almuerzo registrado exitosamente',
            'data' => $workSession
        ]);
    }

    /**
     * Registra el fin de la jornada laboral del usuario.
     */
    public function endWork(Request $request)
    {
        try {
            // Validar datos de entrada
            $request->validate([
                'latitude' => 'nullable|string',
                'longitude' => 'nullable|string',
            ]);
            
            $userId = $request->user()->user_id;
            $currentDate = now()->format('Y-m-d');
            
            $workSession = WorkSession::where('user_id', $userId)
                ->where('work_date', $currentDate)
                ->first();
                
            if (!$workSession) {
                return response()->json([
                    'status' => false,
                    'message' => 'No has registrado tu entrada hoy'
                ], 400);
            }
            
            if ($workSession->end_time) {
                return response()->json([
                    'status' => false,
                    'message' => 'Ya has registrado tu salida hoy'
                ], 400);
            }

            $workSession->update([
                'end_time' => now()->format('H:i')
            ]);

            // Refresh the model to get updated data
            $workSession->refresh();

            return response()->json([
                'status' => true,
                'message' => 'Salida registrada exitosamente',
                'data' => $workSession
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al registrar la salida: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Muestra las sesiones de trabajo de un usuario específico (para administradores).
     */
    public function showUserAttendance($id)
    {
        try {
            $user = User::findOrFail($id);
            $workSessions = WorkSession::where('user_id', $id)
                ->orderBy('work_date', 'desc')
                ->get();

            return response()->json([
                'status' => true,
                'message' => 'Sesiones de trabajo del usuario',
                'data' => [
                    'user' => $user->only(['user_id', 'first_name', 'last_name', 'email']),
                    'sessions' => $workSessions
                ]
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }
    }
}
