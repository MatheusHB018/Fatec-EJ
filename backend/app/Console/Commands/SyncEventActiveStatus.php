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

        // Ativa eventos cujo período engloba o momento atual
        $activated = Event::where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->update(['is_active' => true]);

        // Desativa eventos cujo end_date já passou ou que ainda não iniciaram
        $deactivated = Event::where(function ($q) use ($now) {
                $q->where('end_date', '<', $now)
                  ->orWhere('start_date', '>', $now);
            })->update(['is_active' => false]);

        $this->info("Eventos ativados: {$activated}; Eventos desativados: {$deactivated}");

        return 0;
    }
}
