<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    //
    use HasFactory;
    protected $table = 'roles';
    //LA PRIMARIA DE LA TABLA
    protected $primaryKey = 'role_id';
    //Datos que se ppueden llenar
    protected $fillable = [
        'name',
        'description',
        'salary',
        'admin',
        'created_by',
    ];

    // Casting de tipos para asegurar que admin sea boolean
    protected $casts = [
        'admin' => 'boolean',
    ];

    //RELACIONES

    //Relacion un rol puede ser creado por un solo usuario si es admin
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    //Relacion un rol puede tener muchos usuarios asignados mediante a la tabla employee_details
    public function usersAsigned(): HasMany
    {
        return $this->hasMany(EmployeeDetail::class, 'role_id');
    }
}
