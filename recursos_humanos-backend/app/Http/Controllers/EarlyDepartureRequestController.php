<?php

namespace App\Http\Controllers;

use App\Models\EarlyDepartureRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class EarlyDepartureRequestController extends Controller
{
    /**
     * Muestra una lista de las solicitudes de salida temprana.
     * Para admin: todas las solicitudes
     * Para empleado: solo sus propias solicitudes
     */
    public function index(Request $request)
    {
        // Verificar que el usuario esté autenticado
        if (!$request->user()) {
            return response()->json([
                'status' => false,
                'message' => 'Usuario no autenticado',
                'data' => []
            ], 401);
        }

        // Check if it's an admin request or employee request
        $path = $request->path();
        $isAdmin = str_contains($path, 'admin/early-departure-requests');
        
        \Log::info('EarlyDepartureRequest index called', [
            'url' => $request->url(),
            'path' => $path,
            'isAdmin' => $isAdmin,
            'user' => $request->user()->user_id
        ]);
        
        if ($isAdmin) {
            // Admin sees all requests
            $earlyDepartureRequests = EarlyDepartureRequest::with('user')->orderBy('created_at', 'desc')->get();
            \Log::info('Admin request - found requests', ['count' => $earlyDepartureRequests->count()]);
        } else {
            // Employee sees only their own requests
            $userId = $request->user()->user_id;
            $earlyDepartureRequests = EarlyDepartureRequest::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();
            \Log::info('Employee request - found requests', ['count' => $earlyDepartureRequests->count(), 'userId' => $userId]);
        }
        
        return response()->json([
            'status' => true,
            'message' => 'Lista de solicitudes de salida temprana',
            'data' => $earlyDepartureRequests
        ], 200);
    }

    /**
     * guarda una nueva solicitud de salida temprana.
     */
    public function store(Request $request)
    {
        //
        $request->validate([
            'description' => 'required|string|max:255',
            'request_date' => 'required|date',
            'request_time' => 'required|date_format:H:i',
            'document_path' => 'nullable|string|max:255',
        ]);

        $earlyDepartureRequest = EarlyDepartureRequest::create([
            'user_id' => $request->user()->user_id,
            'description' => $request->description,
            'request_date' => $request->request_date,
            'request_time' => $request->request_time,
            'document_path' => $request->document_path,
            'status' => 'pending',
            'created_by' => $request->user()->user_id,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Solicitud de salida temprana creada con éxito',
            'data' => $earlyDepartureRequest
        ], 201);
    }

    /**
     * muestra la solicitud de salida temprana por ID.
     */
    public function show($id)
    {
        //
        try {
            $earlyDepartureRequest = EarlyDepartureRequest::with('user')->findOrFail($id);
            return response()->json([
                'status' => true,
                'message' => 'Solicitud de salida temprana encontrada',
                'data' => $earlyDepartureRequest
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Solicitud de salida temprana no encontrada',
                'data' => []
            ], 404);
        }
    }


    /**
     * Actualiza la solicitud de salida temprana por ID.
     */
    public function update(Request $request, $id)
    {
        //
        $request->validate([
            'user_id' => 'sometimes|exists:users,id',
            'work_date' => 'sometimes|date',
            'description' => 'sometimes|string|max:255',
            'request_date' => 'sometimes|date',
            'request_time' => 'sometimes|date_format:H:i',
            'document_path' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:pending,approved,rejected',
            'approved_by' => 'sometimes|exists:users,id',
            'created_by' => 'sometimes|exists:users,id',
        ]);

        $earlyDepartureRequest = EarlyDepartureRequest::findOrFail($id);
        $earlyDepartureRequest->update($request->all());

        return response()->json([
            'status' => true,
            'message' => 'Solicitud de salida temprana actualizada con éxito',
            'data' => $earlyDepartureRequest
        ], 200);
    }

    /**
     * Elimina la solicitud de salida temprana por ID.
     */
    public function destroy($id)
    {
        //
        try {
            $earlyDepartureRequest = EarlyDepartureRequest::findOrFail($id);
            $earlyDepartureRequest->delete();
            return response()->json([
                'status' => true,
                'message' => 'Solicitud de salida temprana eliminada con éxito',
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Solicitud de salida temprana no encontrada',
            ], 404);
        }
    }

    /**
     * Aprueba una solicitud de salida temprana (solo admin)
     */
    public function approve(Request $request, $id)
    {
        try {
            $earlyDepartureRequest = EarlyDepartureRequest::findOrFail($id);
            
            $earlyDepartureRequest->update([
                'status' => 'approved',
                'approved_by' => $request->user()->user_id
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Solicitud aprobada con éxito',
                'data' => $earlyDepartureRequest
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Solicitud de salida temprana no encontrada',
            ], 404);
        }
    }

    /**
     * Rechaza una solicitud de salida temprana (solo admin)
     */
    public function reject(Request $request, $id)
    {
        try {
            $earlyDepartureRequest = EarlyDepartureRequest::findOrFail($id);
            
            $earlyDepartureRequest->update([
                'status' => 'rejected',
                'approved_by' => $request->user()->user_id
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Solicitud rechazada con éxito',
                'data' => $earlyDepartureRequest
            ], 200);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => false,
                'message' => 'Solicitud de salida temprana no encontrada',
            ], 404);
        }
    }
}
