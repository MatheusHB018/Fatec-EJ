<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! $token = auth('api')->attempt($validated)) {
            return response()->json([
                'message' => 'Credenciais inválidas.',
            ], 401);
        }

        $user = auth('api')->user();

        return response()->json([
            'message' => 'Login realizado com sucesso.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        if (! $user) {
            return response()->json([
                'message' => 'Não autenticado.',
            ], 401);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function logout(): JsonResponse
    {
        auth('api')->logout();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }
}
