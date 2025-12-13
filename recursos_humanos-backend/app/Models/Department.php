<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    //
    use HasFactory;
    protected $table = 'departments';
    //LA PRIMARIA DE LA TABLA
    protected $primaryKey = 'department_id';
    //Datos que se ppueden llenar
    protected $fillable = [
        'name',
        'branch_id',
        'created_by',
    ];
    //Relaciones

    //un tabla solo puede ser creada por un usuario
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    //un departamento solo puede pertenecer a una sucursal
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    //un departaento puede tener muchos usuarios mediante la tabla employye_details
    public function employeeDetails(): HasMany
    {
        return $this->hasMany(EmployeeDetail::class, 'department_id');
    }

    
}

