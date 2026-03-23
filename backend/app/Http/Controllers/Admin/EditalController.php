<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Edital;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EditalController extends Controller
{
    public function index(): JsonResponse
    {
        $editals = Edital::orderBy('display_order')->orderBy('title')->get();

        return response()->json($editals);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $edital = Edital::create($validated);

        return response()->json([
            'message' => 'Edital criado com sucesso!',
            'data' => $edital,
        ], 201);
    }

    public function update(Request $request, Edital $edital): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $edital->update($validated);

        return response()->json([
            'message' => 'Edital atualizado com sucesso!',
            'data' => $edital->fresh(),
        ]);
    }

    public function destroy(Edital $edital): JsonResponse
    {
        $edital->delete();

        return response()->json([
            'message' => 'Edital removido com sucesso!',
        ]);
    }

    private function validatePayload(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'max:50'],
            'enrollment_period' => ['nullable', 'string', 'max:255'],
            'file_url' => ['nullable', 'url', 'max:255'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['status'] = $validated['status'] ?? 'Em breve';
        $validated['display_order'] = $validated['display_order'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        return $validated;
    }
}