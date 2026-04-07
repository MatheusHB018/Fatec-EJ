<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\NewContactNotification;
use App\Models\Contact;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    /**
     * Lista todas as mensagens recebidas no admin.
     */
    public function index()
    {
        $contacts = Contact::latest()->paginate(15);
        return response()->json($contacts);
    }

    /**
     * Recebe o envio do formulário público (frontend).
     */
    public function store(Request $request)
    {
        $rules = [
            'profile_type' => 'required|in:empresa,aluno',
            'name'         => 'required|string|max:255',
            'email'        => 'required|email',
            'whatsapp'     => 'required|string|max:20',
            'message'      => 'required|string',
        ];

        // Campos extras obrigatórios apenas se for aluno
        if ($request->input('profile_type') === 'aluno') {
            $rules['ra']     = 'required|string|max:20';
            $rules['course'] = 'required|string|max:100';
            $rules['period'] = 'required|in:Manhã,Tarde,Noite';
        }

        $validated = $request->validate($rules);
        $contact = Contact::create($validated);

        // Tarefa 1: Disparo de e-mail de notificação
        try {
            Mail::to('matheusbispo925@gmail.com')->send(new NewContactNotification($contact));
        } catch (\Throwable $e) {
            // Falha de SMTP não deve quebrar a resposta ao usuário
            \Log::warning('Falha ao enviar e-mail de contato: ' . $e->getMessage());
        }

        // Tarefa 2: Criar membro inativo na equipe se for aluno
        if ($request->input('profile_type') === 'aluno') {
            $role = 'Candidato' . ($request->input('course') ? ' - ' . $request->input('course') : '');
            TeamMember::create([
                'name'      => $request->input('name'),
                'role'      => $role,
                'is_active' => false,
            ]);
        }

        return response()->json([
            'message' => 'Mensagem enviada com sucesso!',
        ], 201);
    }

    /**
     * Exibe os detalhes de um contato no admin.
     */
    public function show(Contact $contact)
    {
        return response()->json($contact);
    }

    /**
     * Remove uma mensagem de contato.
     */
    public function destroy(Contact $contact)
    {
        $contact->delete();

        return response()->json([
            'message' => 'Contato removido!',
        ]);
    }
}
