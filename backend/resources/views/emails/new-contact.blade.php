<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Contato — Fatec-EJ</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
        .header { background: #1e3a5f; color: #fff; padding: 24px 32px; }
        .header h1 { margin: 0; font-size: 20px; }
        .body { padding: 24px 32px; color: #333; line-height: 1.6; }
        .field { margin-bottom: 12px; }
        .label { font-weight: bold; color: #555; font-size: 13px; text-transform: uppercase; letter-spacing: .5px; }
        .value { margin-top: 2px; font-size: 15px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .badge-empresa { background: #dbeafe; color: #1d4ed8; }
        .badge-aluno  { background: #dcfce7; color: #15803d; }
        .message-box { background: #f8f9fa; border-left: 4px solid #1e3a5f; padding: 12px 16px; border-radius: 4px; margin-top: 16px; white-space: pre-wrap; }
        .footer { background: #f4f4f4; padding: 16px 32px; font-size: 12px; color: #999; text-align: center; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>📩 Novo Contato pelo Site</h1>
        <p style="margin:4px 0 0; font-size:13px; opacity:.8;">Fatec-EJ — Painel Administrativo</p>
    </div>
    <div class="body">
        <div class="field">
            <div class="label">Tipo</div>
            <div class="value">
                <span class="badge badge-{{ $contact->profile_type }}">
                    {{ $contact->profile_type === 'aluno' ? 'Aluno FATEC' : 'Empresa' }}
                </span>
            </div>
        </div>

        <div class="field">
            <div class="label">Nome</div>
            <div class="value">{{ $contact->name }}</div>
        </div>

        <div class="field">
            <div class="label">E-mail</div>
            <div class="value">{{ $contact->email }}</div>
        </div>

        <div class="field">
            <div class="label">WhatsApp</div>
            <div class="value">{{ $contact->whatsapp }}</div>
        </div>

        @if($contact->profile_type === 'aluno')
        <div class="field">
            <div class="label">RA</div>
            <div class="value">{{ $contact->ra }}</div>
        </div>
        <div class="field">
            <div class="label">Curso</div>
            <div class="value">{{ $contact->course }}</div>
        </div>
        <div class="field">
            <div class="label">Período</div>
            <div class="value">{{ $contact->period }}</div>
        </div>
        @endif

        <div class="field" style="margin-top:20px;">
            <div class="label">Mensagem</div>
            <div class="message-box">{{ $contact->message }}</div>
        </div>
    </div>
    <div class="footer">
        Este e-mail foi gerado automaticamente pelo sistema Fatec-EJ.<br>
        {{ now()->format('d/m/Y H:i') }}
    </div>
</div>
</body>
</html>
