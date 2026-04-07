<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PublicContentController extends Controller
{
    public function index(): JsonResponse
    {
        $sections = $this->getActiveOrdered('site_sections')->keyBy('slug');

        $content = [
            'menu' => $this->getActiveOrdered('menu_items', 'position'),
            'site' => $this->getFirst('site_settings'),
            'settings' => Setting::current(),
            'sections' => $sections,
            'team' => $this->getActiveOrdered('team_members', 'display_order'),
            'services' => $this->getActiveOrdered('services', 'display_order'),
            'pillars' => $this->getActiveOrdered('pillars', 'display_order'),
            'projects' => $this->getActiveOrdered('projects', 'display_order'),
            'editals' => $this->getActiveOrdered('editals', 'display_order'),
            'about' => $this->mapAboutPayload($sections->get('sobre')),
        ];

        return response()->json($content);
    }

    private function getFirst(string $table): ?object
    {
        if (! Schema::hasTable($table)) {
            return null;
        }

        return DB::table($table)->first();
    }

    private function getActiveOrdered(string $table, string $orderBy = 'id')
    {
        if (! Schema::hasTable($table)) {
            return collect();
        }

        $query = DB::table($table);

        if (Schema::hasColumn($table, 'is_active')) {
            $query->where('is_active', true);
        }

        if (Schema::hasColumn($table, $orderBy)) {
            $query->orderBy($orderBy);
        }

        return $query->get();
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
