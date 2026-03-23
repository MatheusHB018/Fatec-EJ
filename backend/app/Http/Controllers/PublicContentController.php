<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PublicContentController extends Controller
{
    public function index(): JsonResponse
    {
        $sections = DB::table('site_sections')
            ->where('is_active', true)
            ->get()
            ->keyBy('slug');

        $content = [
            'menu' => DB::table('menu_items')
                ->where('is_active', true)
                ->orderBy('position')
                ->get(),
            'site' => DB::table('site_settings')->first(),
            'settings' => Setting::current(),
            'sections' => $sections,
            'team' => DB::table('team_members')
                ->where('is_active', true)
                ->orderBy('display_order')
                ->get(),
            'services' => DB::table('services')
                ->where('is_active', true)
                ->orderBy('display_order')
                ->get(),
            'pillars' => DB::table('pillars')
                ->where('is_active', true)
                ->orderBy('display_order')
                ->get(),
            'projects' => DB::table('projects')
                ->where('is_active', true)
                ->orderBy('display_order')
                ->get(),
            'editals' => DB::table('editals')
                ->where('is_active', true)
                ->orderBy('display_order')
                ->get(),
            'about' => $this->mapAboutPayload($sections->get('sobre')),
        ];

        return response()->json($content);
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
