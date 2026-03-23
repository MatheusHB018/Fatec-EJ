<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $products = DB::table('products');
        $contacts = DB::table('contacts');

        $stats = [
            'products_total' => (clone $products)->count(),
            'products_active' => (clone $products)->where('is_active', true)->count(),
            'contacts_total' => (clone $contacts)->count(),
            'team_total' => DB::table('team_members')->count(),
            'services_total' => DB::table('services')->count(),
            'pillars_total' => DB::table('pillars')->count(),
            'projects_total' => DB::table('projects')->count(),
            'editals_total' => DB::table('editals')->count(),
        ];

        $dailyContactsRaw = DB::table('contacts')
            ->selectRaw('DATE(created_at) as date, COUNT(*) as total')
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->groupByRaw('DATE(created_at)')
            ->orderByRaw('DATE(created_at)')
            ->get()
            ->keyBy('date');

        $dailyContacts = [];
        foreach (CarbonPeriod::create(now()->subDays(6)->startOfDay(), now()->startOfDay()) as $date) {
            $formatted = $date->format('Y-m-d');
            $dailyContacts[] = [
                'date' => $formatted,
                'label' => $date->translatedFormat('d/m'),
                'total' => (int) optional($dailyContactsRaw->get($formatted))->total,
            ];
        }

        $productBreakdown = [
            'active' => (clone $products)->where('is_active', true)->count(),
            'inactive' => (clone $products)->where('is_active', false)->count(),
        ];

        $recentContacts = DB::table('contacts')
            ->latest('created_at')
            ->limit(5)
            ->get(['id', 'profile_type', 'name', 'email', 'whatsapp', 'created_at']);

        $recentProducts = DB::table('products')
            ->latest('created_at')
            ->limit(5)
            ->get(['id', 'name', 'price', 'is_active', 'created_at']);

        $systemSections = [
            'about' => $this->mapAboutPayload(DB::table('site_sections')->where('slug', 'sobre')->first()),
            'team' => DB::table('team_members')->orderBy('display_order')->get(),
            'services' => DB::table('services')->orderBy('display_order')->get(),
            'pillars' => DB::table('pillars')->orderBy('display_order')->get(),
            'projects' => DB::table('projects')->orderBy('display_order')->get(),
            'editals' => DB::table('editals')->orderBy('display_order')->get(),
        ];

        return response()->json([
            'stats' => $stats,
            'charts' => [
                'daily_contacts' => $dailyContacts,
                'product_breakdown' => $productBreakdown,
            ],
            'recent' => [
                'contacts' => $recentContacts,
                'products' => $recentProducts,
            ],
            'sections' => $systemSections,
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
        ];
    }
}
