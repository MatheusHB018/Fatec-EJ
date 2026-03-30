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
    protected $appends = ['is_currently_active'];

    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
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
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'quantity' => 'integer',
        'valid_from' => 'date',
        'valid_to' => 'date',
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

    /**
     * Local scope to filter events that are active right now (start_date <= now <= end_date).
     */
    public function scopeActiveNow(Builder $query)
    {
        $now = Carbon::now();
        return $query->where('start_date', '<=', $now)
                     ->where('end_date', '>=', $now);
    }
}
