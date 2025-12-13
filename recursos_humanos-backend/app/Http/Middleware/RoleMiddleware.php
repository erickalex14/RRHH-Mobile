<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        // Cargar el rol del usuario si no está cargado
        $userRole = $request->user()->employeeDetail?->role;
        
        if (!$userRole) {
            return response()->json(['message' => 'Usuario sin rol asignado'], 403);
        }

        // Para el rol 'admin', verificamos el flag admin
        if ($role === 'admin' && !$userRole->admin) {
            return response()->json(['message' => 'No tienes permiso para acceder a este recurso'], 403);
        }

        // Para otros roles, verificamos el nombre del rol
        if ($role !== 'admin' && $userRole->name !== $role) {
            return response()->json(['message' => 'No tienes el rol requerido para acceder a este recurso'], 403);
        }

        return $next($request);
    }
}
