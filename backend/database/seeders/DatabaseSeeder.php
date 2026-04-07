<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SiteSectionSeeder::class,
        ]);

        $now = now();

        DB::table('settings')->updateOrInsert(
            ['id' => 1],
            [
                'site_name' => 'Empresa Junior Fatec',
                'management_name' => 'Gestao Pioneira 2026',
                'hero_title' => 'Transformando ideias em projetos reais',
                'hero_subtitle' => 'Consultoria e desenvolvimento por alunos da Fatec.',
                'about_text' => 'A Empresa Junior Fatec conecta alunos e mercado por meio de projetos de tecnologia, design e inovacao.',
                'contact_email' => 'contato@ejfatec.com.br',
                'contact_phone' => '(18) 99999-0000',
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        DB::table('site_sections')->updateOrInsert(
            ['slug' => 'sobre'],
            [
                'section_name' => 'about',
                'title' => 'Empresa Junior Fatec de Presidente Prudente',
                'subtitle' => 'Quem Somos',
                'content' => json_encode([
                    'summary' => 'Somos uma empresa junior formada por alunos da Fatec, focada em impacto real para negocios locais.',
                    'mission' => 'Entregar solucoes praticas e acessiveis para pequenos e medios negocios.',
                    'vision' => 'Ser referencia regional em projetos academicos com excelencia profissional.',
                    'values' => ['Compromisso', 'Inovacao', 'Aprendizado continuo'],
                    'professor' => 'Prof. Orientador EJ Fatec',
                    'mandate' => 'Gestao 2026',
                    'image_url' => '',
                ], JSON_UNESCAPED_UNICODE),
                'is_active' => true,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        DB::table('about_sections')->updateOrInsert(
            ['id' => 1],
            [
                'title' => 'Sobre a Empresa Junior Fatec',
                'description' => 'Texto institucional de exemplo para validacao visual da aba Sobre no painel.',
                'image' => null,
                'is_active' => true,
                'updated_at' => $now,
                'created_at' => $now,
            ]
        );

        DB::table('team_members')->upsert([
            [
                'name' => 'Joao Silva',
                'role' => 'Desenvolvedor',
                'image' => null,
                'initials' => 'JS',
                'photo_url' => null,
                'display_order' => 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Maria Souza',
                'role' => 'Designer',
                'image' => null,
                'initials' => 'MS',
                'photo_url' => null,
                'display_order' => 2,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Carlos Lima',
                'role' => 'Gerente de Projetos',
                'image' => null,
                'initials' => 'CL',
                'photo_url' => null,
                'display_order' => 3,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['name'], ['role', 'image', 'initials', 'photo_url', 'display_order', 'is_active', 'updated_at']);

        DB::table('projects')->upsert([
            [
                'title' => 'Portal Academico EJ',
                'description' => 'Plataforma web para divulgacao de servicos, editais e eventos da empresa junior.',
                'category' => 'Web',
                'technologies' => 'Laravel, JavaScript, TailwindCSS',
                'image_url' => null,
                'display_order' => 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Sistema de Inscricoes',
                'description' => 'Aplicacao para cadastro de eventos, turmas e inscritos com painel administrativo.',
                'category' => 'Sistemas',
                'technologies' => 'PHP, MySQL, API REST',
                'image_url' => null,
                'display_order' => 2,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['title'], ['description', 'category', 'technologies', 'image_url', 'display_order', 'is_active', 'updated_at']);

        DB::table('products')->upsert([
            [
                'name' => 'Camiseta EJ Fatec',
                'description' => 'Camiseta oficial para eventos e representacao institucional.',
                'price' => 59.90,
                'image_url' => null,
                'coupon_code' => null,
                'coupon_discount' => null,
                'category' => 'vetuario',
                'stock_quantity' => 0,
                'stock_pp' => 5,
                'stock_p' => 8,
                'stock_m' => 12,
                'stock_g' => 10,
                'stock_gg' => 6,
                'stock_xg' => 4,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Caneca EJ Fatec',
                'description' => 'Caneca personalizada para alunos e parceiros.',
                'price' => 29.90,
                'image_url' => null,
                'coupon_code' => null,
                'coupon_discount' => null,
                'category' => 'acessorio',
                'stock_quantity' => 30,
                'stock_pp' => 0,
                'stock_p' => 0,
                'stock_m' => 0,
                'stock_g' => 0,
                'stock_gg' => 0,
                'stock_xg' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['name'], ['description', 'price', 'image_url', 'coupon_code', 'coupon_discount', 'category', 'stock_quantity', 'stock_pp', 'stock_p', 'stock_m', 'stock_g', 'stock_gg', 'stock_xg', 'is_active', 'updated_at']);

        DB::table('services')->upsert([
            [
                'title' => 'Desenvolvimento Web',
                'description' => 'Criacao de sites institucionais e landing pages.',
                'icon' => 'briefcase',
                'display_order' => 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Consultoria em Sistemas',
                'description' => 'Mapeamento de processos e recomendacao de melhorias digitais.',
                'icon' => 'briefcase',
                'display_order' => 2,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['title'], ['description', 'icon', 'display_order', 'is_active', 'updated_at']);

        DB::table('pillars')->upsert([
            [
                'title' => 'Inovacao',
                'description' => 'Buscamos solucoes criativas para desafios reais.',
                'icon' => 'lightbulb',
                'display_order' => 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Resultados',
                'description' => 'Foco em entregar valor mensuravel para cada cliente.',
                'icon' => 'chart-line',
                'display_order' => 2,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['title'], ['description', 'icon', 'display_order', 'is_active', 'updated_at']);

        DB::table('editals')->upsert([
            [
                'title' => 'Edital de Processo Seletivo 2026',
                'description' => 'Selecao de novos membros para os times de projeto da EJ.',
                'status' => 'Aberto',
                'enrollment_period' => '01/04/2026 a 30/04/2026',
                'file_url' => null,
                'display_order' => 1,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ], ['title'], ['description', 'status', 'enrollment_period', 'file_url', 'display_order', 'is_active', 'updated_at']);

        User::updateOrCreate(
            ['email' => 'admin@ejfatec.com.br'],
            [
                'name' => 'Admin EJ',
                'password' => Hash::make('admin123'),
            ]
        );

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
            ]
        );
    }
}
