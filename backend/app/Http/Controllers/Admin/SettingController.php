<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Exibe o formulário de configurações (painel admin – aba Configurações).
     */
    public function index()
    {
        $settings = Setting::current();
        return response()->json($settings);
    }

    /**
     * Retorna as configurações como JSON para consumo do frontend (ex: nome da gestão no footer).
     */
    public function publicShow()
    {
        return response()->json(Setting::current());
    }

    /**
     * Salva as alterações do formulário de configurações.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'management_name' => 'required|string|max:255',
            'hero_title'      => 'nullable|string|max:255',
            'hero_subtitle'   => 'nullable|string',
            'about_text'      => 'nullable|string',
            'contact_email'   => 'nullable|email',
            'contact_phone'   => 'nullable|string|max:20',
        ]);

        $settings = Setting::current();
        $settings->update($validated);

        return response()->json([
            'message' => 'Configurações salvas com sucesso!',
            'data' => $settings->fresh(),
        ]);
    }
}
