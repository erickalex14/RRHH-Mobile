<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class EmployeeDetail extends Model
{
    //
    use HasFactory;
    protected $table = 'employee_details';
    //LA PRIMARIA DE LA TABLA
    protected $primaryKey = 'employee_detail_id';
    //Datos que se ppueden llenar
    protected $fillable = [
        'user_id',
        'role_id',
        'department_id',
        'schedule_id',
        'national_id',
        'address',
        'phone',
        'hire_date',
        'birth_date',
        'created_by',
    ];

    //RELACIONES
    //Relcion un estado solo tiene un usuario
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    //Relacion un empleado solo puede tener un rol
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    //Relacion un empleado solo puede tener un departamento
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    //Relacion un empleado solo puede tener un horario
    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class, 'schedule_id');
    }

    //Un detalle puede ser creado por un usuario
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
