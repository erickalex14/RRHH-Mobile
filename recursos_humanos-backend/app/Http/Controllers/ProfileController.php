<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    /**
     * Obtiene el perfil del usuario autenticado
     */
    public function show(Request $request)
    {
        try {
            // Obtener el usuario autenticado
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Usuario no autenticado',
                ], 401);
            }
            
            // Cargar las relaciones necesarias
            $user->load(
                'employeeState', 
                'employeeDetail.schedule', 
                'employeeDetail.department', 
                'employeeDetail.role', 
                'employeeDetail.department.branch',
                'employeeDetail.department.branch.company'
            );
            
            return response()->json($user, 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al cargar el perfil: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Actualiza los datos del perfil del usuario autenticado
     */
    public function update(Request $request)
    {
        try {
            // Obtener el usuario autenticado
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'status' => false,
                    'message' => 'Usuario no autenticado',
                ], 401);
            }
            
            // Validar los datos
            $request->validate([
                'email' => 'email|unique:users,email,' . $user->id,
                'address' => 'nullable|string',
                'phone' => 'nullable|string',
            ]);
            
            // Actualizar los datos básicos del usuario
            if ($request->has('email')) {
                $user->email = $request->email;
            }
            
            $user->save();
            
            // Actualizar los detalles del empleado si existen
            if ($user->employeeDetail) {
                if ($request->has('address')) {
                    $user->employeeDetail->address = $request->address;
                }
                
                if ($request->has('phone')) {
                    $user->employeeDetail->phone = $request->phone;
                }
                
                $user->employeeDetail->save();
            }
            
            return response()->json([
                'status' => true,
                'message' => 'Perfil actualizado correctamente',
                'data' => $user->load('employeeDetail')
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Error al actualizar el perfil: ' . $e->getMessage(),
            ], 500);
        }
    }
}
