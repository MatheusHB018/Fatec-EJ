<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return $this->unauthorizedResponse();
        }

        $tokenRecord = DB::table('api_tokens')
            ->where('token_hash', hash('sha256', $token))
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->first();

        if (! $tokenRecord) {
            return $this->unauthorizedResponse();
        }

        $user = User::find($tokenRecord->user_id);

        if (! $user) {
            return $this->unauthorizedResponse();
        }

        $request->setUserResolver(fn () => $user);

        DB::table('api_tokens')
            ->where('id', $tokenRecord->id)
            ->update(['updated_at' => now()]);

        return $next($request);
    }

    protected function unauthorizedResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Não autenticado.',
        ], 401);
    }
}
