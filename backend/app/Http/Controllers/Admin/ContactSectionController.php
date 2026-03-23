<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContactSectionController extends Controller
{
    public function show(): JsonResponse
    {
        $section = DB::table('site_sections')->where('slug', 'contato')->first();
        $settings = Setting::current();

        return response()->json([
            'title' => $section->title ?? 'Fale Conosco',
            'subtitle' => $section->subtitle ?? 'Contato',
            'content' => $section->content ?? '',
            'contact_email' => $settings->contact_email,
            'contact_phone' => $settings->contact_phone,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'contact_email' => ['nullable', 'email'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
        ]);

        DB::transaction(function () use ($validated) {
            $section = DB::table('site_sections')->where('slug', 'contato')->first();

            if ($section) {
                DB::table('site_sections')
                    ->where('slug', 'contato')
                    ->update([
                        'title' => $validated['title'],
                        'subtitle' => $validated['subtitle'] ?? null,
                        'content' => $validated['content'] ?? null,
                        'is_active' => true,
                        'updated_at' => now(),
                    ]);
            } else {
                DB::table('site_sections')->insert([
                    'slug' => 'contato',
                    'title' => $validated['title'],
                    'subtitle' => $validated['subtitle'] ?? null,
                    'content' => $validated['content'] ?? null,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $settings = Setting::current();
            $settings->update([
                'contact_email' => $validated['contact_email'] ?? null,
                'contact_phone' => $validated['contact_phone'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Seção de contato atualizada com sucesso!',
        ]);
    }
}