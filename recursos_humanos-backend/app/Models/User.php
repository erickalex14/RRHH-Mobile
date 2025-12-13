<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;  //Para la autenticacion
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;
    protected $table = 'users';
    //LA PRIMARIA DE LA TABLA
    protected $primaryKey = 'user_id';
    //Datos que se ppueden llenar
    protected $fillable = [
        'employee_state_id',
        'first_name',
        'last_name',
        'email',
        'password',
        'created_by',
    ];
    
    //Ocultar el campo de la contraseña
    protected $hidden = [
        'password',
        'remember_token',
    ];

    //relacion un usuario solo tiene un estado
    public function employeeState(): BelongsTo
    {
        return $this->belongsTo(EmployeeState::class, 'employee_state_id');
    }

    //Reacion un usuario puede ser creado por un usuario si es admin
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    //Relacion un usuario puede tener muchos documentos
    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'user_id');
    }

    //Relacion un usuario puedetener varios registros de sesion de trabajo
    public function workSessions(): HasMany
    {
        return $this->hasMany(WorkSession::class, 'user_id');
    }

    //Relacion un usuario puede tener muchos registros de salida antecipada
    public function earlyDepartureRequests(): HasMany
    {
        return $this->hasMany(EarlyDepartureRequest::class, 'user_id');
    }

    //relacion uno a uno con su informacion personal
    public function employeeDetail(): HasOne
    {
        return $this->hasOne(EmployeeDetail::class, 'user_id');
    }

    //RELACIONES DEL CREATED BY:


    //relacion un usuario puede crear muchas companias si es admin
    public function companies(): HasMany
    {
        return $this->hasMany(Company::class, 'created_by');
    }
    
    //relacion un usuario puede crear muchas sucursales si es admin
    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class, 'created_by');
    }

    //relacion un usuario puede crear muchos departamentos si es admin
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class, 'created_by');
    }

    //relacion un usuario puede crear muchos roles si es admin
    public function roles(): HasMany
    {
        return $this->hasMany(Role::class, 'created_by');
    }

        //Relacion un usuario puede crear muchos usuarios si es admin
    public function createdUsers(): HasMany
    {
        return $this->hasMany(User::class, 'created_by');
    }

    //relacion un usuario puede subir muchos documentos
    public function uploadedDocuments(): HasMany
    {
        return $this->hasMany(Document::class, 'uploaded_by');
    }

    //relacion un usuario puede crear muchos horarios si es admin
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'created_by');
    }

    //relacion un usuario puede crear muchos detalles de empleado si es admin
    public function employeeDetailsCreated(): HasMany
    {
        return $this->hasMany(EmployeeDetail::class, 'created_by');
    }

    //relacion un usuario puede revisar muchas solicitudes de salida antecipada si es admin
    public function earlyDepartureRequestsReviewed(): HasMany
    {
        return $this->hasMany(EarlyDepartureRequest::class, 'reviewed_by');
    }

    //Relacion un usuario puede crear muchas sesiones de trabajo si es admin
    public function workSessionsCreated(): HasMany
    {
        return $this->hasMany(WorkSession::class, 'created_by');
    }

}


