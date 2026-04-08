<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegistrationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'name' => ['required', 'string', 'max:255'],
            'institution' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'whatsapp' => ['required', 'string', 'max:20'],
            'cpf' => ['required', 'string', 'max:14'],
            'cep' => ['nullable', 'string'],
            'street' => ['nullable', 'string'],
            'number' => ['nullable', 'string'],
            'neighborhood' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'state' => ['nullable', 'string'],
            'fatec_course' => ['nullable', 'string'],
            // Keep compatibility with old frontend field names.
            'notes' => ['nullable', 'string', 'max:2000'],
            'message' => ['nullable', 'string', 'max:2000'],
            'receipt' => ['nullable', 'file', 'mimes:png,jpg,jpeg,pdf', 'max:10240'],
            'comprovante' => ['nullable', 'file', 'mimes:png,jpg,jpeg,pdf', 'max:10240'],
        ]);

        $event = Event::findOrFail($validated['event_id']);
        if ($event->end_date && now()->gt($event->end_date)) {
            return response()->json(['message' => 'Inscricoes encerradas para este evento.'], 422);
        }

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store('receipts', 'public');
        } elseif ($request->hasFile('comprovante')) {
            $receiptPath = $request->file('comprovante')->store('receipts', 'public');
        }

        $registration = Registration::create([
            'event_id' => (int) $validated['event_id'],
            'name' => $validated['name'],
            'institution' => $validated['institution'] ?? null,
            'email' => $validated['email'],
            'whatsapp' => $validated['whatsapp'],
            'cpf' => $validated['cpf'],
            'cep' => $validated['cep'] ?? null,
            'street' => $validated['street'] ?? null,
            'number' => $validated['number'] ?? null,
            'neighborhood' => $validated['neighborhood'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'fatec_course' => $validated['fatec_course'] ?? null,
            'receipt_path' => $receiptPath,
            'notes' => $validated['notes'] ?? ($validated['message'] ?? null),
        ]);

        return response()->json([
            'message' => 'Inscricao realizada com sucesso! Aguarde confirmacao.',
            'registration' => $registration,
        ], 201);
    }

    public function eventRegistrations(int $eventId): JsonResponse
    {
        $event = Event::findOrFail($eventId);

        $registrations = Registration::where('event_id', $event->id)
            ->latest('created_at')
            ->get();

        return response()->json($registrations);
    }

    public function update(Request $request, Registration $registration): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'institution' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'whatsapp' => ['required', 'string', 'max:20'],
            'cpf' => ['required', 'string', 'max:14'],
            'fatec_course' => ['nullable', 'string'],
            'cep' => ['nullable', 'string'],
            'street' => ['nullable', 'string'],
            'number' => ['nullable', 'string'],
            'neighborhood' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'state' => ['nullable', 'string'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'receipt' => ['nullable', 'file', 'mimes:png,jpg,jpeg,pdf', 'max:10240'],
        ]);

        $data = [
            'name' => $validated['name'],
            'institution' => $validated['institution'] ?? null,
            'email' => $validated['email'],
            'whatsapp' => $validated['whatsapp'],
            'cpf' => $validated['cpf'],
            'fatec_course' => $validated['fatec_course'] ?? null,
            'cep' => $validated['cep'] ?? null,
            'street' => $validated['street'] ?? null,
            'number' => $validated['number'] ?? null,
            'neighborhood' => $validated['neighborhood'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ];

        if ($request->hasFile('receipt')) {
            $data['receipt_path'] = $request->file('receipt')->store('receipts', 'public');
        }

        $registration->update($data);

        return response()->json([
            'message' => 'Inscricao atualizada com sucesso.',
            'registration' => $registration->fresh(),
        ]);
    }

    public function destroy(Registration $registration): JsonResponse
    {
        $registration->delete();

        return response()->json([
            'message' => 'Inscricao removida com sucesso.',
        ]);
    }
}
