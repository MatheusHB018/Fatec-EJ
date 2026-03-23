<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AboutController extends Controller
{
    public function show(): JsonResponse
    {
        $section = DB::table('site_sections')->where('slug', 'sobre')->first();

        return response()->json($this->mapAboutPayload($section));
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subtitle' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['nullable', 'string'],
            'mission' => ['nullable', 'string'],
            'vision' => ['nullable', 'string'],
            'values' => ['nullable', 'array'],
            'values.*' => ['string'],
            'professor' => ['nullable', 'string', 'max:255'],
            'mandate' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'url', 'max:2048'],
        ]);

        $section = DB::table('site_sections')->where('slug', 'sobre')->first();

        if (! $section) {
            DB::table('site_sections')->insert([
                'slug' => 'sobre',
                'title' => $validated['title'],
                'subtitle' => $validated['subtitle'] ?? 'Quem Somos',
                'content' => json_encode([
                    'summary' => $validated['summary'] ?? '',
                    'mission' => $validated['mission'] ?? '',
                    'vision' => $validated['vision'] ?? '',
                    'values' => array_values(array_filter($validated['values'] ?? [])),
                    'professor' => $validated['professor'] ?? '',
                    'mandate' => $validated['mandate'] ?? '',
                    'image_url' => $validated['image_url'] ?? '',
                ], JSON_UNESCAPED_UNICODE),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('site_sections')
                ->where('id', $section->id)
                ->update([
                    'title' => $validated['title'],
                    'subtitle' => $validated['subtitle'] ?? 'Quem Somos',
                    'content' => json_encode([
                        'summary' => $validated['summary'] ?? '',
                        'mission' => $validated['mission'] ?? '',
                        'vision' => $validated['vision'] ?? '',
                        'values' => array_values(array_filter($validated['values'] ?? [])),
                        'professor' => $validated['professor'] ?? '',
                        'mandate' => $validated['mandate'] ?? '',
                        'image_url' => $validated['image_url'] ?? '',
                    ], JSON_UNESCAPED_UNICODE),
                    'updated_at' => now(),
                ]);
        }

        Setting::current()->update([
            'about_text' => $validated['summary'] ?? '',
        ]);

        $updatedSection = DB::table('site_sections')->where('slug', 'sobre')->first();

        return response()->json([
            'message' => 'Seção Sobre atualizada com sucesso!',
            'data' => $this->mapAboutPayload($updatedSection),
        ]);
    }

    private function mapAboutPayload(?object $section): array
    {
        $defaults = [
            'subtitle' => 'Quem Somos',
            'title' => 'Empresa Júnior Fatec de Presidente Prudente',
            'summary' => '',
            'mission' => '',
            'vision' => '',
            'values' => [],
            'professor' => '',
            'mandate' => '',
            'image_url' => '',
        ];

        if (! $section) {
            return $defaults;
        }

        $decoded = json_decode((string) $section->content, true);

        if (! is_array($decoded)) {
            $decoded = [];
        }

        return [
            'subtitle' => $section->subtitle ?: $defaults['subtitle'],
            'title' => $section->title ?: $defaults['title'],
            'summary' => $decoded['summary'] ?? (string) ($section->content ?? ''),
            'mission' => $decoded['mission'] ?? '',
            'vision' => $decoded['vision'] ?? '',
            'values' => array_values(array_filter($decoded['values'] ?? [])),
            'professor' => $decoded['professor'] ?? '',
            'mandate' => $decoded['mandate'] ?? '',
            'image_url' => $decoded['image_url'] ?? '',
        ];
    }
}
