<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inscrito;

class InscritoController extends Controller
{
    public function index()
    {
        $inscritos = Inscrito::with('event')->orderBy('created_at', 'desc')->get();
        return response()->json($inscritos);
    }

    public function destroy(Inscrito $inscrito)
    {
        $inscrito->delete();
        return response()->json(['message' => 'Inscrito removido com sucesso.']);
    }
}
