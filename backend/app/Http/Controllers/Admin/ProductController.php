<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

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
     * Exibe somente os produtos ATIVOS para a loja pública (API/frontend).
     */
    public function publicIndex()
    {
        $products = Product::active()->latest()->get();
        return response()->json($products);
    }

    /**
     * Formulário de criação.
     */
    public function create()
    {
        return response()->json([
            'message' => 'Endpoint de formulário não utilizado em API.',
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
            'image_url'   => 'nullable|url',
            'is_active'   => 'boolean',
        ]);

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
     * Formulário de edição.
     */
    public function edit(Product $product)
    {
        return response()->json([
            'message' => 'Endpoint de formulário não utilizado em API.',
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
            'image_url'   => 'nullable|url',
            'is_active'   => 'boolean',
        ]);

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
        $product->delete();

        return response()->json([
            'message' => 'Produto removido!',
        ]);
    }
}
