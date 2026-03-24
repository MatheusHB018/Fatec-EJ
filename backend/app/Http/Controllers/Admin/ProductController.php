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
     * Normalize diferentes formatos de entrada para `sizes` em um mapa associativo
     * Exemplo de saída: ['PP' => 1, 'P' => 0, 'M' => 2, 'G' => 0, 'GG' => 0, 'XG' => 0]
     * Aceita:
     * - JSON string ("{\"PP\":1,...}\")
     * - array de strings (["PP","P"])
     * - array de objetos ([{"size":"P","qty":2}])
     * - mapa associativo já (['PP'=>1, ...])
     */
    private function normalizeSizes($raw)
    {
        $canonical = ['PP' => 0, 'P' => 0, 'M' => 0, 'G' => 0, 'GG' => 0, 'XG' => 0];

        if ($raw === null) return $canonical;

        // if it's a JSON string, try decode
        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE) $raw = $decoded;
        }

        // if it's an object-like (stdClass), convert to array
        if (is_object($raw)) {
            $raw = (array) $raw;
        }

        // if array and associative map (size => qty)
        if (is_array($raw)) {
            $isAssoc = array_keys($raw) !== range(0, count($raw) - 1);
            if ($isAssoc) {
                foreach ($raw as $k => $v) {
                    $key = strtoupper(trim($k));
                    if (array_key_exists($key, $canonical)) {
                        $canonical[$key] = is_numeric($v) ? (int)$v : ($v ? 1 : 0);
                    }
                }
                return $canonical;
            }

            // otherwise it's a sequential array: could be strings or objects
            foreach ($raw as $entry) {
                if (is_string($entry)) {
                    $key = strtoupper(trim($entry));
                    if (array_key_exists($key, $canonical)) $canonical[$key] = max(1, $canonical[$key]);
                } elseif (is_array($entry)) {
                    // { size: 'P', qty: 2 } or { P: 2 }
                    if (!empty($entry['size'])) {
                        $key = strtoupper(trim($entry['size']));
                        $qty = isset($entry['qty']) ? (int)$entry['qty'] : (isset($entry['quantity']) ? (int)$entry['quantity'] : 1);
                        if (array_key_exists($key, $canonical)) $canonical[$key] = max(0, $qty);
                    } else {
                        foreach ($entry as $k => $v) {
                            $key = strtoupper(trim($k));
                            if (array_key_exists($key, $canonical)) $canonical[$key] = is_numeric($v) ? (int)$v : ($v ? 1 : 0);
                        }
                    }
                }
            }
        }

        return $canonical;
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
     * Exibe os detalhes públicos de um produto específico (para o modal/loja).
     * Retorna JSON com: name, price, description, category, images[], sizes[], colors[]
     */
    public function publicShow($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Produto não encontrado.'], 404);
        }

        // Build images array (use asset() to provide full URL if available)
        $images = [];
        if ($product->image_url) {
            $images[] = asset($product->image_url);
        }

        // Build sizes map from stock columns
        $sizesMap = [
            'PP' => (int) ($product->stock_pp ?? 0),
            'P' => (int) ($product->stock_p ?? 0),
            'M' => (int) ($product->stock_m ?? 0),
            'G' => (int) ($product->stock_g ?? 0),
            'GG' => (int) ($product->stock_gg ?? 0),
            'XG' => (int) ($product->stock_xg ?? 0),
        ];

        $totalStock = array_sum(array_values($sizesMap));

        // If not active or no stock, return unavailable
        if (!$product->is_active || $totalStock <= 0) {
            return response()->json(['message' => 'Produto Indisponível'], 404);
        }

        // Colors: not stored currently — return empty array (frontend can ignore)
        $colors = [];

        return response()->json([
            'id' => $product->id,
            'name' => $product->name,
            'price' => (string) $product->price,
            'description' => $product->description,
            'category' => $product->category,
            'images' => $images,
            // return sizes map and also available_sizes for convenience
            'sizes' => $sizesMap,
            'available_sizes' => $product->available_sizes,
            'stock_pp' => $sizesMap['PP'],
            'stock_p' => $sizesMap['P'],
            'stock_m' => $sizesMap['M'],
            'stock_g' => $sizesMap['G'],
            'stock_gg' => $sizesMap['GG'],
            'stock_xg' => $sizesMap['XG'],
            'coupon_code' => $product->coupon_code,
            'coupon_discount' => (string) ($product->coupon_discount ?? 0),
            'colors' => $colors,
            'is_active' => $product->is_active,
        ]);
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

        // Normalize sizes input: accept JSON string, array of strings, array of objects or associative map
        if ($request->has('sizes')) {
            $sizesRaw = $request->input('sizes');
            $sizesMap = $this->normalizeSizes($sizesRaw);
            // map canonical sizes into explicit stock_* columns
            $validated['stock_pp'] = $sizesMap['PP'];
            $validated['stock_p']  = $sizesMap['P'];
            $validated['stock_m']  = $sizesMap['M'];
            $validated['stock_g']  = $sizesMap['G'];
            $validated['stock_gg'] = $sizesMap['GG'];
            $validated['stock_xg'] = $sizesMap['XG'];
            // do not persist a 'sizes' JSON column — it was migrated to stock_* columns
            if (array_key_exists('sizes', $validated)) unset($validated['sizes']);
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
            $sizesMap = $this->normalizeSizes($sizesRaw);
            // map to stock columns for update
            $validated['stock_pp'] = $sizesMap['PP'];
            $validated['stock_p']  = $sizesMap['P'];
            $validated['stock_m']  = $sizesMap['M'];
            $validated['stock_g']  = $sizesMap['G'];
            $validated['stock_gg'] = $sizesMap['GG'];
            $validated['stock_xg'] = $sizesMap['XG'];
            if (array_key_exists('sizes', $validated)) unset($validated['sizes']);
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

