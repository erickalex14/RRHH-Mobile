<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{   

    //LOGIN
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required'
            ]);

            $user = User::where('email', $request->email)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                throw ValidationException::withMessages([
                    'email' => ['Las credenciales proporcionadas son incorrectas.'],
                ]);
            }

            // Crear token con el nombre del dispositivo
            $token = $user->createToken('auth_token')->plainTextToken;
            $user->load([
                'employeeState',
                'employeeDetail.schedule',
                'employeeDetail.department',
                'employeeDetail.role',
                'employeeDetail.department.branch',
                'employeeDetail.department.branch.company'
            ]);

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'No se pudo conectar con el sistema. Intente más tarde.'
            ], 503);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Ocurrió un error inesperado. Intente más tarde.'
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            // Revocar el token actual
            $request->user()->currentAccessToken()->delete();
            return response()->json([
                'message' => 'Sesión cerrada exitosamente'
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'No se pudo conectar con el sistema. Intente más tarde.'
            ], 503);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Ocurrió un error inesperado. Intente más tarde.'
            ], 500);
        }
    }

    public function me(Request $request)
    {
        try {
            // Obtener usuario autenticado con sus relaciones
            $user = $request->user()->load([
                'employeeState',
                'employeeDetail.schedule',
                'employeeDetail.department',
                'employeeDetail.role',
                'employeeDetail.department.branch',
                'employeeDetail.department.branch.company'
            ]);
            return response()->json([
                'user' => $user
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json([
                'message' => 'No se pudo conectar con el sistema. Intente más tarde.'
            ], 503);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Ocurrió un error inesperado. Intente más tarde.'
            ], 500);
        }
    }
}
