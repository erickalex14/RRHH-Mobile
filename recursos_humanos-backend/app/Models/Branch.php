<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    //
    use HasFactory;
    protected $table = 'branches';

    //LA PRIMARIA DE LA TABLA
    protected $primaryKey = 'branch_id';
    //Datos que se ppueden llenar
    protected $fillable = [
        'name',
        'company_id',
        'code',
        'address',
        'city',
        'state',
        'country',
        'phone',
        'email',
        'matrix',
        'created_by',
    ];

    //Relaciones
    //un tabla solo puede ser creada por un usuario
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    //una sucursal solo puede pertenecer a una empresa
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    //una sucursal puedetener varios departamentos
    public function departments(): HasMany
    {
        return $this->hasMany(Department::class, 'branch_id');
    }

    
}
