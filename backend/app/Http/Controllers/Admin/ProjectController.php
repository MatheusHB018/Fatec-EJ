<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(): JsonResponse
    {
        $projects = Project::orderBy('display_order')->orderBy('title')->get();

        return response()->json($projects);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $project = Project::create($validated);

        return response()->json([
            'message' => 'Projeto criado com sucesso!',
            'data' => $project,
        ], 201);
    }

    public function update(Request $request, Project $project): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $project->update($validated);

        return response()->json([
            'message' => 'Projeto atualizado com sucesso!',
            'data' => $project->fresh(),
        ]);
    }

    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json([
            'message' => 'Projeto removido com sucesso!',
        ]);
    }

    private function validatePayload(Request $request): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'technologies' => ['nullable', 'string'],
            'image_url' => ['nullable', 'url', 'max:255'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['display_order'] = $validated['display_order'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        return $validated;
    }
}