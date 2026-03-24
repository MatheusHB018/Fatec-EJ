<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    /**
     * Campos que podem ser preenchidos em massa (Mass Assignment).
     */
    protected $fillable = [
        'name',
        'description',
        'price',
        'image_url',
        'category',
        'coupon_code',
        'coupon_discount',
        'is_active',
        'stock_pp',
        'stock_p',
        'stock_m',
        'stock_g',
        'stock_gg',
        'stock_xg',
        'stock_quantity',
    ];

    /**
     * Cast automático de tipos.
     */
    protected $casts = [
        'price'     => 'decimal:2',
        'is_active' => 'boolean',
        'coupon_discount' => 'decimal:2',
    // 'sizes' JSON column removed in favor of explicit stock_* columns
        'stock_pp' => 'integer',
        'stock_p' => 'integer',
        'stock_m' => 'integer',
        'stock_g' => 'integer',
        'stock_gg' => 'integer',
        'stock_xg' => 'integer',
        'stock_quantity' => 'integer',
    ];

    // Accessor: available_sizes returns array of size codes with stock > 0
    public function getAvailableSizesAttribute()
    {
        $map = [];
        $pairs = [
            'PP' => $this->stock_pp ?? 0,
            'P' => $this->stock_p ?? 0,
            'M' => $this->stock_m ?? 0,
            'G' => $this->stock_g ?? 0,
            'GG' => $this->stock_gg ?? 0,
            'XG' => $this->stock_xg ?? 0,
        ];

        foreach ($pairs as $k => $v) {
            if ((int)$v > 0) $map[] = $k;
        }

        return $map;
    }

    /**
     * Scope: retorna apenas produtos ativos (visíveis na loja pública).
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
