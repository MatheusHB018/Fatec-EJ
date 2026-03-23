<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Lista todos os produtos para o painel admin.
     */
    public function index()
    {
        $products = Product::latest()->paginate(15);
        return response()->json($products);
    }

    /**
     * Exibe somente os produtos ATIVOS para a loja p?blica (API/frontend).
     */
    public function publicIndex()
    {
        $products = Product::active()->latest()->get();
        return response()->json($products);
    }

    /**
     * Formul?rio de cria??o.
     */
    public function create()
    {
        return response()->json([
            'message' => 'Endpoint de formul?rio n?o utilizado em API.',
        ], 405);
    }

    /**
     * Salva novo produto.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'image'       => 'nullable|image|max:5120', // max 5MB
            'image_url'   => 'nullable|url',
            'coupon_code'     => 'nullable|string|max:50',
            'coupon_discount' => 'nullable|numeric|min:0',
            'category'        => 'required|string|in:vetuario,acessorio',
            'is_active'       => 'nullable',
            'sizes'           => 'nullable', // will normalize below (expecting array or json)
            'stock_quantity'  => 'nullable|integer|min:0',
        ]);

        // Normalize is_active when present (FormData sends strings like "true"/"false")
        if (array_key_exists('is_active', $validated)) {
            $validated['is_active'] = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($validated['is_active'] === null) {
                // fallback to false if value couldn't be parsed
                $validated['is_active'] = false;
            }
        } else {
            $validated['is_active'] = false;
        }

        // handle uploaded image (multipart/form-data)
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        // Normalize sizes input: accept JSON string (FormData) or array
        if ($request->has('sizes')) {
            $sizesRaw = $request->input('sizes');
            if (is_string($sizesRaw)) {
                $decoded = json_decode($sizesRaw, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $validated['sizes'] = $decoded;
                }
            } elseif (is_array($sizesRaw)) {
                $validated['sizes'] = $sizesRaw;
            }
        }

        // Normalize stock_quantity if present (FormData sends strings)
        if ($request->has('stock_quantity')) {
            $validated['stock_quantity'] = (int) $request->input('stock_quantity');
        }

        $product = Product::create($validated);

        return response()->json([
            'message' => 'Produto criado com sucesso!',
            'data' => $product,
        ], 201);
    }

    /**
     * Exibe detalhes de um produto.
     */
    public function show(Product $product)
    {
        return response()->json($product);
    }

    /**
     * Formul?rio de edi??o.
     */
    public function edit(Product $product)
    {
        return response()->json([
            'message' => 'Endpoint de formul?rio n?o utilizado em API.',
            'data' => $product,
        ], 405);
    }

    /**
     * Atualiza produto existente.
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'image'       => 'nullable|image|max:5120', // max 5MB
            'image_url'   => 'nullable|url',
            'coupon_code'     => 'nullable|string|max:50',
            'coupon_discount' => 'nullable|numeric|min:0',
            'category'        => 'required|string|in:vetuario,acessorio',
            'is_active'       => 'nullable',
            'sizes'           => 'nullable',
            'stock_quantity'  => 'nullable|integer|min:0',
        ]);

        // Normalize is_active when present (FormData sends strings like "true"/"false")
        if (array_key_exists('is_active', $validated)) {
            $validated['is_active'] = filter_var($validated['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($validated['is_active'] === null) {
                // fallback to false if value couldn't be parsed
                $validated['is_active'] = false;
            }
        } else {
            $validated['is_active'] = false;
        }

        // handle new uploaded image: delete old file and set new path
        if ($request->hasFile('image')) {
            // delete old image if exists
            if ($product->image_url) {
                $old = ltrim(str_replace('/storage/', '', $product->image_url), '/');
                if (Storage::disk('public')->exists($old)) {
                    Storage::disk('public')->delete($old);
                }
            }

            $path = $request->file('image')->store('products', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        // Normalize sizes input for update as well
        if ($request->has('sizes')) {
            $sizesRaw = $request->input('sizes');
            if (is_string($sizesRaw)) {
                $decoded = json_decode($sizesRaw, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $validated['sizes'] = $decoded;
                }
            } elseif (is_array($sizesRaw)) {
                $validated['sizes'] = $sizesRaw;
            }
        }

        // Normalize stock_quantity when updating
        if ($request->has('stock_quantity')) {
            $validated['stock_quantity'] = (int) $request->input('stock_quantity');
        }

        $product->update($validated);

        return response()->json([
            'message' => 'Produto atualizado!',
            'data' => $product->fresh(),
        ]);
    }

    /**
     * Remove produto.
     */
    public function destroy(Product $product)
    {
        // if product has image, delete it
        if ($product->image_url) {
            $old = ltrim(str_replace('/storage/', '', $product->image_url), '/');
            if (Storage::disk('public')->exists($old)) {
                Storage::disk('public')->delete($old);
            }
        }

        $product->delete();

        return response()->json([
            'message' => 'Produto removido!',
        ]);
    }
}

