<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;

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
        Contact::create($validated);

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
