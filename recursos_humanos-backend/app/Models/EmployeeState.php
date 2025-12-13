<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmployeeState extends Model
{
    //
    use HasFactory;
    protected $table = 'employee_states';
    //LA PRIMARIA DE LA TABLA
    protected $primaryKey = 'employee_state_id';
    //Datos que se ppueden llenar
    protected $fillable = [
        'name',
        'description',
        'active',
    ];

    //relacion un estado puede tener muchos usuarios
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'employee_state_id', 'employee_state_id');
    }

}
