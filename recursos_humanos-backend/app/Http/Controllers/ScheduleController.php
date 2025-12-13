<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\User;
use App\Models\EarlyDepartureRequest;
use App\Models\Department;
use Illuminate\database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;


class ScheduleController extends Controller
{
    /**
     * Mestra una lista de los horarios.
     */
    public function index()
    {
        $schedules = Schedule::with('user')->get();

        return response()->json([
            'status' => true,
            'message' => 'Lista de horarios',
            'data' => $schedules
        ], 200);
    }


    /**
     * Almacena un nuevo horario.
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'name'=> 'required|string|max:255',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i',
                'lunch_start' => 'required|date_format:H:i',
                'lunch_end' => 'required|date_format:H:i',
                'active' => 'required|boolean',
                'created_by' => 'nullable|exists:users,user_id',
            ]);

            $schedule = Schedule::create($request->all());

            return response()->json([
                'status' => true,
                'message' => 'Horario creado con éxito',
                'data' => $schedule
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al crear el horario: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * muestra el horario por id.
     */
    public function show($id)
    {
        try {
            $schedule = Schedule::with('user')->findOrFail($id);
            return response()->json([
                'status' => true,
                'message' => 'Horario encontrado',
                'data' => $schedule
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Horario no encontrado',
            ], 404);
        }
    }


    /**
     * Actualiza el horario por id.
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'name'=> 'sometimes|string|max:255',
                'start_time' => 'sometimes|date_format:H:i',
                'end_time' => 'sometimes|date_format:H:i',
                'lunch_start_time' => 'sometimes|date_format:H:i',
                'lunch_end_time' => 'sometimes|date_format:H:i',
                'active' => 'sometimes|boolean',
            ]);

            $schedule = Schedule::findOrFail($id);
            
            // Map frontend field names to backend column names
            $updateData = [];
            if ($request->has('name')) $updateData['name'] = $request->name;
            if ($request->has('start_time')) $updateData['start_time'] = $request->start_time;
            if ($request->has('end_time')) $updateData['end_time'] = $request->end_time;
            if ($request->has('lunch_start_time')) $updateData['lunch_start'] = $request->lunch_start_time;
            if ($request->has('lunch_end_time')) $updateData['lunch_end'] = $request->lunch_end_time;
            if ($request->has('active')) $updateData['active'] = $request->active;
            
            $schedule->update($updateData);
            
            return response()->json([
                'status' => true,
                'message' => 'Horario actualizado con éxito',
                'data' => $schedule->fresh()
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Horario no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al actualizar el horario: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $schedule = Schedule::findOrFail($id);
            $schedule->delete();
            return response()->json([
                'status' => true,
                'message' => 'Horario eliminado con éxito',
            ], 201);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Horario no encontrado',
            ], 404);
        }
    }
}
