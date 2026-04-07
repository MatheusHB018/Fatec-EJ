<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class Event extends Model
{
    use HasFactory;

    // expose computed attribute to array/json
    protected $appends = ['is_currently_active', 'formatted_date'];

    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'course_schedules',
        'location',
        'registration_type',
        'entry_type',
        'modality',
        'category',
        'price',
        'quantity',
        'valid_from',
        'valid_to',
        'pix_key',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'course_schedules' => 'array',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'quantity' => 'integer',
        'valid_from' => 'datetime',
        'valid_to' => 'datetime',
    ];

    // Formatter for price when getting/setting (suggested in task)
    protected function price(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => number_format($value, 2, ',', '.'),
            set: fn ($value) => str_replace([".", ","], ['', '.'], $value),
        );
    }

    /**
     * Accessor to indicate whether the event is currently active based on start/end datetimes.
     * Returns true if now() is between start_date and end_date (inclusive).
     */
    protected function isCurrentlyActive(): Attribute
    {
        return Attribute::make(get: function ($value, $attributes) {
            try {
                $now = Carbon::now();
                $start = isset($attributes['start_date']) ? Carbon::parse($attributes['start_date']) : null;
                $end = isset($attributes['end_date']) ? Carbon::parse($attributes['end_date']) : null;

                if (! $start || ! $end) return false;

                return $now->greaterThanOrEqualTo($start) && $now->lessThanOrEqualTo($end);
            } catch (\Exception $e) {
                return false;
            }
        });
    }

    public function getFormattedDateAttribute(): ?string
    {
        try {
            $start = $this->start_date instanceof Carbon
                ? $this->start_date
                : ($this->start_date ? Carbon::parse($this->start_date) : null);

            $end = $this->end_date instanceof Carbon
                ? $this->end_date
                : ($this->end_date ? Carbon::parse($this->end_date) : null);

            if (! $start) {
                return null;
            }

            if (! $end) {
                return $start->format('d/m/Y - H:i');
            }

            if ($start->isSameDay($end)) {
                return sprintf('%s - %s as %s', $start->format('d/m/Y'), $start->format('H:i'), $end->format('H:i'));
            }

            return sprintf('%s ate %s', $start->format('d/m/Y - H:i'), $end->format('d/m/Y - H:i'));
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Local scope to filter events that are active right now (start_date <= now <= end_date).
     */
    public function scopeActiveNow(Builder $query)
    {
        $now = Carbon::now();
        return $query->where('start_date', '<=', $now)
                     ->where('end_date', '>=', $now);
    }

    public function registrations()
    {
        return $this->hasMany(Registration::class);
    }
}
