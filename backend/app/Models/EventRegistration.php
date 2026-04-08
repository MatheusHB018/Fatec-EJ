<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'name',
        'email',
        'whatsapp',
        'cpf',
        'cep',
        'street',
        'number',
        'neighborhood',
        'city',
        'state',
        'fatec_course',
        'comprovante_url',
        'message',
        'status',
    ];

    protected $casts = [
        'event_id' => 'integer',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
