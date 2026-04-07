<?php

namespace Database\Seeders;

use App\Models\SiteSection;
use Illuminate\Database\Seeder;

class SiteSectionSeeder extends Seeder
{
    public function run(): void
    {
        SiteSection::updateOrCreate(
            ['section_name' => 'home'],
            [
                'slug' => 'home',
                'title' => 'Bem-vindo',
                'subtitle' => 'Home',
                'content' => [
                    'title' => 'Bem-vindo',
                ],
                'is_active' => true,
            ]
        );
    }
}
