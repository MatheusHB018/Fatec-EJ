<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamMemberController extends Controller
{
    public function index(): JsonResponse
    {
        $members = TeamMember::orderBy('display_order')->orderBy('name')->get();

        return response()->json($members);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $member = TeamMember::create($validated);

        return response()->json([
            'message' => 'Membro da equipe criado com sucesso!',
            'data' => $member,
        ], 201);
    }

    public function update(Request $request, TeamMember $teamMember): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $teamMember->update($validated);

        return response()->json([
            'message' => 'Membro da equipe atualizado com sucesso!',
            'data' => $teamMember->fresh(),
        ]);
    }

    public function destroy(TeamMember $teamMember): JsonResponse
    {
        $teamMember->delete();

        return response()->json([
            'message' => 'Membro da equipe removido com sucesso!',
        ]);
    }

    private function validatePayload(Request $request): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'role' => ['required', 'string', 'max:150'],
            'initials' => ['nullable', 'string', 'max:10'],
            'photo_url' => ['nullable', 'url', 'max:255'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['display_order'] = $validated['display_order'] ?? 0;
        $validated['is_active'] = $validated['is_active'] ?? true;

        if (empty($validated['initials'])) {
            $validated['initials'] = collect(explode(' ', $validated['name']))
                ->filter()
                ->take(2)
                ->map(fn (string $part) => mb_strtoupper(mb_substr($part, 0, 1)))
                ->implode('');
        }

        return $validated;
    }
}
