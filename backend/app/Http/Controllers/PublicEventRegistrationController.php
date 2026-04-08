<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\Inscrito;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PublicEventRegistrationController extends Controller
{
    public function store(Request $request)
    {
        $rules = [
            'event_id' => 'nullable|exists:events,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'whatsapp' => 'required|string|max:20',
            'cpf' => ['required', 'string', 'max:14', 'regex:/^\d{3}\.\d{3}\.\d{3}-\d{2}$/'],
            'cep' => 'nullable|string|max:9',
            'street' => 'nullable|string|max:255',
            'number' => 'nullable|string|max:10',
            'neighborhood' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|size:2',
            'fatec_course' => 'nullable|string|max:100',
            'message' => 'nullable|string|max:1000',
            'comprovante' => 'required|file|mimes:png,jpg,jpeg,pdf|max:10240',
        ];

        $data = $request->validate($rules);

        $event = null;
        if (!empty($data['event_id'])) {
            $event = Event::find($data['event_id']);
            if ($event) {
                $now = now();
                if ($event->end_date && $now->gt($event->end_date)) {
                    return response()->json(['message' => 'Inscrições encerradas para este evento.'], 422);
                }
            }
        }

        if ($request->hasFile('comprovante')) {
            $file = $request->file('comprovante');
            $path = $file->store('comprovantes', 'public');
            $data['comprovante_url'] = Storage::disk('public')->url($path);
        } else {
            $data['comprovante_url'] = null;
        }

        // Garantir que event_id esteja presente como int ou null
        $data['event_id'] = $data['event_id'] ?? null;

        $registration = EventRegistration::create([
            'event_id' => $data['event_id'],
            'name' => $data['name'],
            'email' => $data['email'],
            'whatsapp' => $data['whatsapp'],
            'cpf' => $data['cpf'],
            'cep' => $data['cep'] ?? null,
            'street' => $data['street'] ?? null,
            'number' => $data['number'] ?? null,
            'neighborhood' => $data['neighborhood'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'fatec_course' => $data['fatec_course'] ?? null,
            'comprovante_url' => $data['comprovante_url'],
            'message' => $data['message'] ?? null,
            'status' => 'pendente',
        ]);

        Inscrito::create([
            'event_id' => $data['event_id'],
            'name' => $data['name'],
            'email' => $data['email'],
            'whatsapp' => $data['whatsapp'],
            'cpf' => $data['cpf'],
            'cep' => $data['cep'] ?? null,
            'street' => $data['street'] ?? null,
            'number' => $data['number'] ?? null,
            'neighborhood' => $data['neighborhood'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'fatec_course' => $data['fatec_course'] ?? null,
            'comprovante_url' => $data['comprovante_url'],
            'message' => $data['message'] ?? null,
            'status' => 'pendente',
        ]);

        return response()->json(['message' => 'Inscrição realizada com sucesso! Aguarde confirmação.', 'registration' => $registration], 201);
    }
}
