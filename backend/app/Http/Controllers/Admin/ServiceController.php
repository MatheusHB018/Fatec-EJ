<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index(): JsonResponse
    {
        $services = Service::orderBy('display_order')->orderBy('title')->get();

        return response()->json($services);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $service = Service::create($validated);

        return response()->json([
            'message' => 'Serviço criado com sucesso!',
            'data' => $service,
        ], 201);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $service->update($validated);

        return response()->json([
            'message' => 'Serviço atualizado com sucesso!',
            'data' => $service->fresh(),
        ]);
    }

    public function destroy(Service $service): JsonResponse
    {
        $service->delete();

        return response()->json([
            'message' => 'Serviço removido com sucesso!',
        ]);
    }

    private function validatePayload(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['display_order'] = $validated['display_order'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        // Ícone padronizado para todos os serviços
        $validated['icon'] = 'briefcase';

        return $validated;
    }
}
