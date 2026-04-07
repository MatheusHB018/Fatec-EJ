<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PasswordResetController extends Controller
{
    /**
     * Envia um link de recuperação de senha para o e-mail do usuário.
     */
    public function sendResetLink(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            return response()->json([
                'message' => 'E-mail não encontrado.',
            ], 400);
        }

        // Gera um token seguro
        $token = Str::random(64);

        // Armazena o token no banco de dados
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $validated['email']],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        // Monta o link que aponta para o frontend
        $resetLink = "http://localhost/Fatec-EJ/frontend/nova-senha.html?token=" . $token . "&email=" . urlencode($validated['email']);

        // Envia o e-mail com o link customizado
        try {
            Mail::send('emails.reset-password', ['resetLink' => $resetLink], function ($message) use ($validated) {
                $message->to($validated['email'])
                        ->subject('[Fatec-EJ] Recupere Sua Senha');
            });

            return response()->json([
                'message' => 'Link de recuperação enviado para o e-mail.',
            ], 200);
        } catch (\Throwable $e) {
            \Log::warning('Falha ao enviar e-mail de reset: ' . $e->getMessage());
            return response()->json([
                'message' => 'Não foi possível enviar o e-mail.',
            ], 500);
        }
    }

    /**
     * Redefine a senha do usuário.
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email'                 => 'required|email|exists:users,email',
            'token'                 => 'required|string',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        // Verifica se o token é válido
        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->first();

        if (!$resetRecord || !Hash::check($validated['token'], $resetRecord->token)) {
            return response()->json([
                'message' => 'Token inválido ou expirado.',
            ], 400);
        }

        // Verifica se o token não expirou (60 minutos)
        if (now()->diffInMinutes($resetRecord->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();
            return response()->json([
                'message' => 'Token expirou.',
            ], 400);
        }

        // Atualiza a senha do usuário
        $user = User::where('email', $validated['email'])->first();
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Remove o token usado
        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return response()->json([
            'message' => 'Senha redefinida com sucesso!',
        ], 200);
    }
}

