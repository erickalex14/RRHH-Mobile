<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{    public function handle(Request $request, Closure $next)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        // Cargar el rol del usuario si no está cargado
        $userRole = $request->user()->employeeDetail?->role;
        
        if (!$userRole) {
            return response()->json(['message' => 'Usuario sin rol asignado'], 403);
        }

        // Verificar si el usuario tiene permisos de administrador
        if (!$userRole->admin) {
            return response()->json(['message' => 'No tienes permiso para acceder a este recurso'], 403);
        }

        return $next($request);
    }
}
