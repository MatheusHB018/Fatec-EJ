<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Event;
use Illuminate\Support\Carbon;

class SyncEventActiveStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    // Use the requested command name to match the specification
    protected $signature = 'app:update-event-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza o campo is_active dos eventos com base em start_date/end_date (ativa somente durante o período)';

    public function handle()
    {
        $now = Carbon::now();

        // Ativa eventos que ainda não terminaram (engloba futuros e em andamento)
        $activated = Event::where('end_date', '>=', $now)
            ->update(['is_active' => true]);

        // Desativa apenas eventos cujo end_date já passou definitivamente
        $deactivated = Event::where('end_date', '<', $now)
            ->update(['is_active' => false]);

        $this->info("Eventos ativados: {$activated}; Eventos desativados: {$deactivated}");

        return 0;
    }
}
